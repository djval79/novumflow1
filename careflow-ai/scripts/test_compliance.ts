
import { createClient } from '@supabase/supabase-js';

// Hardcoded from lib/supabase.ts
const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🛡️ Starting Compliance Enforcement Verification...');

    // 1. Get/Create Tenant
    let { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) {
        console.log('⚠️ No tenants found. Creating test tenant...');
        const { data: newTenant, error } = await supabase.from('tenants').insert({
            name: 'Compliance Test Tenant',
            slug: 'compliance-test',
            subdomain: 'compliance-test',
            settings: {} // <--- Initialize settings
        }).select().single();
        if (error) { console.error('Failed to create tenant', error); return; }
        tenant = newTenant;
    } else {
        // Ensure settings exist for existing tenant
        if (!tenant.settings) {
            await supabase.from('tenants').update({ settings: {} }).eq('id', tenant.id);
        }
    }
    const tenantId = tenant.id;

    // 2. Get/Create Client
    let { data: client } = await supabase.from('clients').select('id').eq('tenant_id', tenantId).limit(1).single();
    if (!client) {
        const { data: newClient, error } = await supabase.from('clients').insert({ tenant_id: tenantId, first_name: 'Test', last_name: 'Client', status: 'Active' }).select().single();
        if (error) { console.error('Failed to create client', error); return; }
        client = newClient;
    }

    // 3. Create Non-Compliant Employee
    const nonCompliantId = crypto.randomUUID();
    console.log(`\n👤 Creating Non-Compliant Employee (${nonCompliantId})...`);
    const { error: empError } = await supabase.from('employees').insert({
        id: nonCompliantId,
        tenant_id: tenantId,
        first_name: 'Bad',
        last_name: 'Staff',
        email: `bad.staff.${Date.now()}@example.com`,
        status: 'active',
        role: 'Carer',
        right_to_work_status: 'Expired', // <--- INVALID
        right_to_work_expiry: '2020-01-01',
        dbs_status: 'Clear'
    });
    if (empError) { console.error('Failed to create employee', empError); return; }

    // 4. Attempt to Assign Visit (Should Fail)
    console.log('🚫 Attempting to assign visit to Non-Compliant Staff...');
    const { error: visitError } = await supabase.from('visits').insert({
        tenant_id: tenantId,
        client_id: client.id,
        staff_id: nonCompliantId,
        visit_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        visit_type: 'Personal Care'
    });

    if (visitError) {
        console.log('✅ BLOCKED: Visit assignment failed as expected.');
        console.log('   Error:', visitError.message);
    } else {
        console.error('❌ FAILURE: Visit was assigned despite non-compliance!');
    }

    // 5. Create Compliant Employee
    const compliantId = crypto.randomUUID();
    console.log(`\n👤 Creating Compliant Employee (${compliantId})...`);
    const { error: empError2 } = await supabase.from('employees').insert({
        id: compliantId,
        tenant_id: tenantId,
        first_name: 'Good',
        last_name: 'Staff',
        email: `good.staff.${Date.now()}@example.com`,
        status: 'active',
        role: 'Carer',
        right_to_work_status: 'Valid', // <--- VALID
        right_to_work_expiry: '2030-01-01',
        dbs_status: 'Clear'
    });
    if (empError2) { console.error('Failed to create employee', empError2); return; }

    // 6. Attempt to Assign Visit (Should Succeed)
    console.log('✅ Attempting to assign visit to Compliant Staff...');
    const { error: visitError2 } = await supabase.from('visits').insert({
        tenant_id: tenantId,
        client_id: client.id,
        staff_id: compliantId,
        visit_date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '11:00',
        visit_type: 'Personal Care'
    });

    if (visitError2) {
        console.error('❌ FAILURE: Visit assignment failed for compliant staff!', visitError2);
    } else {
        console.log('✅ SUCCESS: Visit assigned successfully.');
    }
}

main();
