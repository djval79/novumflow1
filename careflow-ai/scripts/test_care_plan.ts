
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🚀 Starting Care Plan Verification...');

    // 1. Setup
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) { console.error('❌ No tenant found'); return; }

    // Ensure Client
    let { data: client } = await supabase.from('clients').select('id').eq('tenant_id', tenant.id).limit(1).single();
    if (!client) {
        console.log('⚠️ Creating dummy client...');
        const { data: newClient } = await supabase.from('clients').insert({
            tenant_id: tenant.id,
            first_name: 'CarePlan',
            last_name: 'Test',
            status: 'Active'
        }).select().single();
        client = newClient;
    }

    console.log(`📋 Using Tenant: ${tenant.id}, Client: ${client.id}`);

    // 2. Create Care Plan
    console.log('\n1️⃣ Creating Care Plan...');
    const tasks = [
        { id: 't1', label: 'Morning Wash' },
        { id: 't2', label: 'Medication Prompt' }
    ];

    const { error: planError } = await supabase.rpc('debug_create_care_plan', {
        p_tenant_id: tenant.id,
        p_client_id: client.id,
        p_summary: 'Test Plan',
        p_tasks: tasks
    });

    if (planError) {
        console.error('❌ Failed to create care plan:', planError);
        return;
    }
    console.log('✅ Care Plan Created with 2 tasks.');

    // 3. Create Recurring Schedule (Weekly on Mon(1))
    const startDate = new Date().toISOString().split('T')[0];
    const daysOfWeek = [1]; // Mon

    console.log('\n2️⃣ Creating Recurring Schedule...');
    const { data: schedule, error: scheduleError } = await supabase
        .from('recurring_schedules')
        .insert({
            tenant_id: tenant.id,
            client_id: client.id,
            visit_type: 'Personal Care',
            start_date: startDate,
            start_time: '09:00',
            end_time: '10:00',
            frequency: 'Weekly',
            days_of_week: daysOfWeek
        })
        .select()
        .single();

    if (scheduleError) {
        console.error('❌ Failed to create schedule:', scheduleError);
        return;
    }
    console.log('✅ Schedule Created:', schedule.id);

    // 4. Generate Visits (Next 7 days)
    console.log('\n3️⃣ Generating Visits...');
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const { error: genError } = await supabase.rpc('generate_visits_from_schedule', {
        p_schedule_id: schedule.id,
        p_generation_end_date: endDate.toISOString().split('T')[0]
    });

    if (genError) {
        console.error('❌ Generation Failed:', genError);
        return;
    }
    console.log('✅ Visits Generated.');

    // 5. Verify Tasks in Generated Visit
    console.log('\n4️⃣ Verifying Tasks in Generated Visit...');
    const { data: visits, error: listError } = await supabase
        .from('visits')
        .select('visit_date, tasks')
        .eq('client_id', client.id)
        .eq('start_time', '09:00')
        .gte('visit_date', startDate);

    if (listError) {
        console.error('❌ Failed to list visits:', listError);
    } else {
        if (visits.length > 0) {
            const visit = visits[0];
            console.log(`Found visit on ${visit.visit_date}`);
            console.log('Tasks:', JSON.stringify(visit.tasks));

            // Check if tasks match
            // Note: JSONB order might differ, but content should be same
            const hasTask1 = visit.tasks.some((t: any) => t.label === 'Morning Wash');
            const hasTask2 = visit.tasks.some((t: any) => t.label === 'Medication Prompt');

            if (hasTask1 && hasTask2) {
                console.log('✅ Verification SUCCESS: Tasks auto-populated correctly.');
            } else {
                console.error('❌ Verification FAILED: Tasks missing.');
            }
        } else {
            console.error('❌ Verification FAILED: No visits found.');
        }
    }

    // Cleanup
    await supabase.from('recurring_schedules').delete().eq('id', schedule.id);
    await supabase.from('visits').delete().eq('client_id', client.id).eq('start_time', '09:00');
    // Care plan can stay for manual testing
}

main();
