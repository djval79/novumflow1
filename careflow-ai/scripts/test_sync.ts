
import { createClient } from '@supabase/supabase-js';

// Hardcoded from lib/supabase.ts
const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must be provided via env

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🔄 Starting Sync Verification...');

    // 1. Mock Payload from NovumFlow
    const mockPayload = {
        action: 'employee.created',
        tenant_id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', // Use a real tenant ID if possible, or this will fail FK
        employee: {
            id: crypto.randomUUID(),
            full_name: 'Sync Test Employee',
            email: `sync_test_${Date.now()}@example.com`,
            phone: '07700900000',
            role: 'Care Worker',
            status: 'Active',
            compliance: {
                right_to_work_status: 'Valid',
                right_to_work_expiry: '2030-01-01',
                dbs_status: 'Clear',
                dbs_expiry: '2026-05-01',
                dbs_number: 'DBS123456'
            }
        }
    };

    console.log(`\n📦 Payload prepared for employee: ${mockPayload.employee.full_name}`);

    // 2. Call Edge Function (Simulated)
    // Since we can't easily call the local edge function via URL without serving it, 
    // we will simulate the logic by calling the DB directly using the same logic as the function.
    // This verifies the DB schema and logic, if not the HTTP endpoint itself.

    console.log('\n🚀 Simulating Edge Function logic...');

    // Split full name into first and last name
    const nameParts = mockPayload.employee.full_name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const careFlowEmployee = {
        tenant_id: mockPayload.tenant_id,
        novumflow_employee_id: mockPayload.employee.id,
        first_name: firstName,
        last_name: lastName,
        email: mockPayload.employee.email,
        phone: mockPayload.employee.phone,
        role: 'Carer', // Mapped from Care Worker
        status: 'active',
        right_to_work_status: mockPayload.employee.compliance.right_to_work_status,
        right_to_work_expiry: mockPayload.employee.compliance.right_to_work_expiry,
        dbs_status: mockPayload.employee.compliance.dbs_status,
        dbs_expiry: mockPayload.employee.compliance.dbs_expiry,
        dbs_number: mockPayload.employee.compliance.dbs_number,
        compliance_data: mockPayload.employee.compliance,
        updated_at: new Date().toISOString()
    };

    // We need a valid tenant ID first. Let's fetch one.
    let { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();

    if (!tenant) {
        console.log('⚠️ No tenants found. Creating test tenant...');
        const { data: newTenant, error: createError } = await supabase
            .from('tenants')
            .insert({
                name: 'Test Tenant',
                slug: 'test-tenant',
                subdomain: 'test-tenant',
                subscription_status: 'active'
            })
            .select()
            .single();

        if (createError) {
            console.error('❌ Failed to create test tenant:', createError);
            return;
        }
        tenant = newTenant;
        console.log('✅ Created test tenant.');
    }
    careFlowEmployee.tenant_id = tenant.id;
    console.log(`Using Tenant ID: ${tenant.id}`);

    const { data, error } = await supabase
        .from("employees")
        .upsert(careFlowEmployee, { onConflict: "novumflow_employee_id" })
        .select()
        .single();

    if (error) {
        console.error('❌ Sync Failed:', error);
    } else {
        console.log('✅ Employee Synced Successfully!');
        console.log('   ID:', data.id);
        console.log('   Name:', `${data.first_name} ${data.last_name}`);
        console.log('   RTW Status:', data.right_to_work_status);
        console.log('   DBS Status:', data.dbs_status);
    }
}

main();
