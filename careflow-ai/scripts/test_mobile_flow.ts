
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🚀 Starting Mobile Flow Verification...');

    // 1. Setup: Get Tenant, Client, and Staff
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) { console.error('❌ No tenant found'); return; }

    // Ensure Client
    let { data: client } = await supabase.from('clients').select('id').eq('tenant_id', tenant.id).limit(1).single();
    if (!client) {
        console.log('⚠️ Creating dummy client...');
        const { data: newClient } = await supabase.from('clients').insert({
            tenant_id: tenant.id,
            first_name: 'Mobile',
            last_name: 'TestClient',
            status: 'Active'
        }).select().single();
        client = newClient;
    }

    // Ensure Staff
    let { data: staff } = await supabase.from('employees').select('id').eq('tenant_id', tenant.id).limit(1).single();
    if (!staff) {
        console.log('⚠️ Creating dummy staff...');
        const { data: newStaff } = await supabase.from('employees').insert({
            tenant_id: tenant.id,
            first_name: 'Mobile',
            last_name: 'Carer',
            status: 'active',
            email: `mobile.carer.${Date.now()}@example.com`,
            right_to_work_status: 'Valid',
            dbs_status: 'Clear'
        }).select().single();
        staff = newStaff;
    }

    console.log(`📋 Using Tenant: ${tenant.id}, Client: ${client.id}, Staff: ${staff.id}`);

    // 2. Create a Visit with Tasks
    const date = new Date().toISOString().split('T')[0];
    const tasks = [
        { id: 't1', label: 'Morning Wash', completed: false },
        { id: 't2', label: 'Breakfast', completed: false }
    ];

    console.log('\n1️⃣ Creating Visit with Tasks...');
    const { data: visit, error: createError } = await supabase
        .from('visits')
        .insert({
            tenant_id: tenant.id,
            client_id: client.id,
            staff_id: staff.id,
            visit_date: date,
            start_time: '08:00',
            end_time: '09:00',
            visit_type: 'Personal Care',
            status: 'Scheduled',
            tasks: tasks
        })
        .select()
        .single();

    if (createError) {
        console.error('❌ Failed to create visit:', createError);
        return;
    }
    console.log('✅ Visit Created:', visit.id);

    // 3. Simulate Check-In
    console.log('\n2️⃣ Simulating Check-In...');
    const { error: checkInError } = await supabase
        .from('visits')
        .update({
            status: 'In Progress',
            check_in_time: new Date().toISOString()
        })
        .eq('id', visit.id);

    if (checkInError) console.error('❌ Check-in failed:', checkInError);
    else console.log('✅ Checked In');

    // 4. Simulate Task Completion
    console.log('\n3️⃣ Simulating Task Completion...');
    const updatedTasks = [
        { id: 't1', label: 'Morning Wash', completed: true },
        { id: 't2', label: 'Breakfast', completed: false }
    ];
    const { error: taskError } = await supabase
        .from('visits')
        .update({ tasks: updatedTasks })
        .eq('id', visit.id);

    if (taskError) console.error('❌ Task update failed:', taskError);
    else console.log('✅ Tasks Updated');

    // 5. Simulate Check-Out
    console.log('\n4️⃣ Simulating Check-Out...');
    const { error: checkOutError } = await supabase
        .from('visits')
        .update({
            status: 'Completed',
            check_out_time: new Date().toISOString()
        })
        .eq('id', visit.id);

    if (checkOutError) console.error('❌ Check-out failed:', checkOutError);
    else console.log('✅ Checked Out');

    // 6. Verify Final State
    console.log('\n5️⃣ Verifying Final State...');
    const { data: finalVisit } = await supabase
        .from('visits')
        .select('status, tasks, check_in_time, check_out_time')
        .eq('id', visit.id)
        .single();

    if (finalVisit.status === 'Completed' && finalVisit.tasks[0].completed === true && finalVisit.check_in_time && finalVisit.check_out_time) {
        console.log('✅ Verification SUCCESS: Visit completed, tasks saved, times recorded.');
    } else {
        console.error('❌ Verification FAILED:', finalVisit);
    }

    // Cleanup
    await supabase.from('visits').delete().eq('id', visit.id);
}

main();
