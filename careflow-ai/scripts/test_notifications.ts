
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🚀 Starting Notification Verification...');

    // 1. Setup
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) { console.error('❌ No tenant found'); return; }

    // Ensure Client
    let { data: client } = await supabase.from('clients').select('id').eq('tenant_id', tenant.id).limit(1).single();
    if (!client) {
        console.log('⚠️ Creating dummy client...');
        const { data: newClient } = await supabase.from('clients').insert({
            tenant_id: tenant.id,
            first_name: 'Notif',
            last_name: 'Test',
            status: 'Active'
        }).select().single();
        client = newClient;
    }

    // Get a user to notify (we'll use the first user found)
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError || !users || users.length === 0) {
        console.error('❌ No users found to notify');
        return;
    }
    const targetUser = users[0];
    console.log(`📋 Using Tenant: ${tenant.id}, Client: ${client.id}, User: ${targetUser.id}`);

    // 2. Create a "Missed" Visit (Scheduled for 1 hour ago)
    console.log('\n1️⃣ Creating Past Visit...');

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const startTime = oneHourAgo.toTimeString().slice(0, 5); // HH:MM
    const endTime = new Date(now.getTime() - 30 * 60 * 1000).toTimeString().slice(0, 5);

    const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert({
            tenant_id: tenant.id,
            client_id: client.id,
            visit_date: now.toISOString().split('T')[0], // Today
            start_time: startTime,
            end_time: endTime,
            visit_type: 'Check-in',
            status: 'Scheduled' // Still scheduled, so it's missed
        })
        .select()
        .single();

    if (visitError) {
        console.error('❌ Failed to create visit:', visitError);
        return;
    }
    console.log('✅ Past Visit Created:', visit.id, `Time: ${startTime}`);

    // 3. Trigger Notification (Using our helper RPC for testing specific user targeting)
    console.log('\n2️⃣ Triggering Notification...');

    // We use the helper RPC because the main cron job logic for "who to notify" is simplified/placeholder
    // and we want to verify the notification creation mechanism itself.
    const { error: rpcError } = await supabase.rpc('trigger_missed_visit_notification', {
        p_visit_id: visit.id,
        p_user_id: targetUser.id
    });

    if (rpcError) {
        console.error('❌ RPC Failed:', rpcError);
        return;
    }
    console.log('✅ Notification Triggered via RPC');

    // 4. Verify Notification Exists
    console.log('\n3️⃣ Verifying Notification...');
    const { data: notifs, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetUser.id)
        .eq('link', `/visit/${visit.id}`)
        .order('created_at', { ascending: false })
        .limit(1);

    if (notifError) {
        console.error('❌ Failed to fetch notifications:', notifError);
        return;
    }

    if (notifs && notifs.length > 0) {
        console.log('✅ Notification Found:', notifs[0].title, '-', notifs[0].message);
        console.log('✅ Verification SUCCESS');
    } else {
        console.error('❌ Verification FAILED: Notification not found.');
    }

    // Cleanup
    await supabase.from('visits').delete().eq('id', visit.id);
    if (notifs && notifs.length > 0) {
        await supabase.from('notifications').delete().eq('id', notifs[0].id);
    }
}

main();
