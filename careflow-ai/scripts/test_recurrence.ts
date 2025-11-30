
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🚀 Starting Recurrence Verification...');

    // 1. Setup
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) { console.error('❌ No tenant found'); return; }

    let { data: client } = await supabase.from('clients').select('id').eq('tenant_id', tenant.id).limit(1).single();
    if (!client) {
        console.log('⚠️ Creating dummy client...');
        const { data: newClient } = await supabase.from('clients').insert({
            tenant_id: tenant.id,
            first_name: 'Recurrence',
            last_name: 'Test',
            status: 'Active'
        }).select().single();
        client = newClient;
    }

    console.log(`📋 Using Tenant: ${tenant.id}, Client: ${client.id}`);

    // 2. Create Recurring Schedule (Weekly on Mon(1) and Fri(5))
    const startDate = new Date().toISOString().split('T')[0];
    const daysOfWeek = [1, 5]; // Mon, Fri

    console.log('\n1️⃣ Creating Recurring Schedule (Mon, Fri)...');
    const { data: schedule, error: scheduleError } = await supabase
        .from('recurring_schedules')
        .insert({
            tenant_id: tenant.id,
            client_id: client.id,
            visit_type: 'Personal Care',
            start_date: startDate,
            start_time: '10:00',
            end_time: '11:00',
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

    // 3. Generate Visits (Next 14 days)
    console.log('\n2️⃣ Generating Visits for next 14 days...');
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    const { data: count, error: genError } = await supabase.rpc('generate_visits_from_schedule', {
        p_schedule_id: schedule.id,
        p_generation_end_date: endDate.toISOString().split('T')[0]
    });

    if (genError) {
        console.error('❌ Generation Failed:', genError);
    } else {
        console.log(`✅ Generated ${count} visits.`);
    }

    // 4. Verify Visits
    console.log('\n3️⃣ Verifying Generated Visits...');
    const { data: visits, error: listError } = await supabase
        .from('visits')
        .select('date, start_time')
        .eq('client_id', client.id)
        .eq('start_time', '10:00')
        .gte('date', startDate);

    if (listError) {
        console.error('❌ Failed to list visits:', listError);
    } else {
        console.log(`Found ${visits.length} visits:`);
        visits.forEach(v => console.log(` - ${v.date} at ${v.start_time}`));

        if (visits.length > 0) {
            console.log('✅ Verification SUCCESS: Visits generated.');
        } else {
            console.error('❌ Verification FAILED: No visits found.');
        }
    }

    // Cleanup
    await supabase.from('recurring_schedules').delete().eq('id', schedule.id);
    // Visits should cascade delete if we set up FKs correctly, but we didn't link visits to schedule yet.
    // So we manually delete them.
    await supabase.from('visits').delete().eq('client_id', client.id).eq('start_time', '10:00');
}

main();
