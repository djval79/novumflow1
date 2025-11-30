
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🚀 Starting Rostering Verification...');

    // 1. Setup: Get Tenant, Client, and Staff
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) { console.error('❌ No tenant found'); return; }

    let { data: client } = await supabase.from('clients').select('id').eq('tenant_id', tenant.id).limit(1).single();
    if (!client) {
        console.log('⚠️ No client found. Creating dummy client...');
        const { data: newClient, error: clientError } = await supabase.from('clients').insert({
            tenant_id: tenant.id,
            first_name: 'Test',
            last_name: 'Client',
            status: 'Active'
        }).select().single();

        if (clientError) { console.error('❌ Failed to create client:', clientError); return; }
        client = newClient;
    }

    // Find a compliant staff member (or create one)
    // For simplicity, let's just pick one. If they are non-compliant, the insert will fail (which is also a test).
    let { data: staff } = await supabase.from('employees').select('id, first_name').eq('tenant_id', tenant.id).limit(1).single();
    if (!staff) {
        console.log('⚠️ No staff found. Creating dummy compliant staff...');
        const { data: newStaff, error: staffError } = await supabase.from('employees').insert({
            tenant_id: tenant.id,
            first_name: 'Test',
            last_name: 'Carer',
            status: 'active',
            email: `staff.${Date.now()}@example.com`,
            right_to_work_status: 'Valid',
            dbs_status: 'Clear'
        }).select().single();

        if (staffError) { console.error('❌ Failed to create staff:', staffError); return; }
        staff = newStaff;
    }

    console.log(`📋 Using Tenant: ${tenant.id}, Client: ${client.id}, Staff: ${staff.first_name} (${staff.id})`);

    // 2. Create First Shift
    const date = new Date().toISOString().split('T')[0];
    const startTime = '09:00';
    const endTime = '10:00';

    console.log(`\n1️⃣ Creating Shift 1 (${startTime} - ${endTime})...`);
    const { data: shift1, error: error1 } = await supabase
        .from('visits')
        .insert({
            tenant_id: tenant.id,
            client_id: client.id,
            staff_id: staff.id,
            visit_date: date,
            start_time: startTime,
            end_time: endTime,
            visit_type: 'Personal Care',
            status: 'Scheduled'
        })
        .select()
        .single();

    if (error1) {
        console.error('❌ Failed to create Shift 1:', error1.message);
        // If it failed due to compliance, that's fine, but we need a compliant staff for the conflict test.
        return;
    }
    console.log('✅ Shift 1 Created:', shift1.id);

    // 3. Test Conflict Detection (RPC)
    console.log(`\n2️⃣ Testing Conflict Detection (Overlapping: 09:30 - 10:30)...`);
    const { data: conflicts, error: conflictError } = await supabase.rpc('check_visit_conflicts', {
        p_staff_id: staff.id,
        p_date: date,
        p_start_time: '09:30',
        p_end_time: '10:30'
    });

    if (conflictError) {
        console.error('❌ Conflict RPC Failed:', conflictError);
    } else {
        if (conflicts.length > 0) {
            console.log(`✅ Conflict Detected! Found ${conflicts.length} overlapping shift(s).`);
            console.log('   Conflicting Visit ID:', conflicts[0].visit_id);
        } else {
            console.error('❌ NO Conflict Detected (Expected 1).');
        }
    }

    // 4. Attempt to Create Overlapping Shift (Should NOT block at DB level unless we added a trigger, but UI blocks it)
    // The plan said "Hard Block", but we implemented it in the UI via the RPC check.
    // The DB doesn't have a constraint for overlaps yet (unless we add one).
    // Let's verify that the RPC *would* have caught it.

    // 5. Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabase.from('visits').delete().eq('id', shift1.id);
    console.log('✅ Cleanup complete.');
}

main();
