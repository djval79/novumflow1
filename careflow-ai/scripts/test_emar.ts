
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🚀 Starting eMAR Verification...');

    // 1. Setup
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) { console.error('❌ No tenant found'); return; }

    // Ensure Client
    let { data: client } = await supabase.from('clients').select('id').eq('tenant_id', tenant.id).limit(1).single();
    if (!client) {
        console.log('⚠️ Creating dummy client...');
        const { data: newClient } = await supabase.from('clients').insert({
            tenant_id: tenant.id,
            first_name: 'eMAR',
            last_name: 'Test',
            status: 'Active'
        }).select().single();
        client = newClient;
    }

    // Ensure Staff (for logging)
    let { data: staff } = await supabase.from('employees').select('id').eq('tenant_id', tenant.id).limit(1).single();
    if (!staff) {
        console.error('❌ No staff found');
        return;
    }

    console.log(`📋 Using Tenant: ${tenant.id}, Client: ${client.id}, Staff: ${staff.id}`);

    // 2. Create Medication
    console.log('\n1️⃣ Creating Medication...');
    const { data: med, error: medError } = await supabase
        .from('medications')
        .insert({
            tenant_id: tenant.id,
            client_id: client.id,
            name: 'Test Med',
            dosage: '500mg',
            frequency: 'Morning',
            route: 'Oral',
            status: 'Active'
        })
        .select()
        .single();

    if (medError) {
        console.error('❌ Failed to create medication:', medError);
        return;
    }
    console.log('✅ Medication Created:', med.id);

    // 3. Create Visit
    console.log('\n2️⃣ Creating Visit...');
    const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert({
            tenant_id: tenant.id,
            client_id: client.id,
            staff_id: staff.id,
            visit_date: new Date().toISOString().split('T')[0],
            start_time: '08:00',
            end_time: '09:00',
            visit_type: 'Personal Care',
            status: 'In Progress'
        })
        .select()
        .single();

    if (visitError) {
        console.error('❌ Failed to create visit:', visitError);
        return;
    }
    console.log('✅ Visit Created:', visit.id);

    // 4. Log Medication Administration
    console.log('\n3️⃣ Logging Administration...');
    const { data: log, error: logError } = await supabase
        .from('medication_logs')
        .insert({
            tenant_id: tenant.id,
            visit_id: visit.id,
            medication_id: med.id,
            status: 'Administered',
            administered_by: staff.id,
            administered_at: new Date().toISOString()
        })
        .select()
        .single();

    if (logError) {
        console.error('❌ Failed to log medication:', logError);
        return;
    }
    console.log('✅ Medication Logged:', log.id, log.status);

    // 5. Verify Log
    if (log.status === 'Administered' && log.medication_id === med.id) {
        console.log('✅ Verification SUCCESS: eMAR log created correctly.');
    } else {
        console.error('❌ Verification FAILED: Log mismatch.');
    }

    // Cleanup
    await supabase.from('medication_logs').delete().eq('id', log.id);
    await supabase.from('medications').delete().eq('id', med.id);
    await supabase.from('visits').delete().eq('id', visit.id);
}

main();
