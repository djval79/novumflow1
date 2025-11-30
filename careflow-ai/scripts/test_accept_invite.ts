
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🚀 Starting Accept Invite Verification...');

    // 1. Create a dummy invitation directly
    const tenantId = 'd9adbda0-9c4d-4dc0-9348-0a1ade17699a'; // Use existing tenant from previous test if possible, or fetch one

    // Fetch a valid tenant
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) {
        console.error('❌ No tenants found. Run test_tenant_flow.ts first.');
        return;
    }

    const token = `verify-token-${Date.now()}`;
    const email = `verify.${Date.now()}@example.com`;

    // Get a valid user for invited_by
    const { data: users } = await supabase.auth.admin.listUsers();
    const inviterId = users.users[0]?.id;

    if (!inviterId) {
        console.error('❌ No users found.');
        return;
    }

    console.log(`📝 Creating invitation for ${email} with token: ${token}`);
    const { error: insertError } = await supabase
        .from('tenant_invitations')
        .insert({
            tenant_id: tenant.id,
            email: email,
            role: 'member',
            invited_by: inviterId,
            token: token
        });

    if (insertError) {
        console.error('❌ Failed to insert invitation:', insertError);
        return;
    }

    // 2. Call accept_tenant_invitation
    console.log('🔄 Calling accept_tenant_invitation...');
    const { data, error } = await supabase.rpc('accept_tenant_invitation', {
        p_token: token
    });

    if (error) {
        console.log('⚠️ RPC Error:', error.message);

        if (error.message.includes('null value in column "user_id"')) {
            console.log('✅ SUCCESS: RPC executed and failed on user_id (Expected for Service Role call).');
            console.log('   This confirms the function exists and accepts the TEXT token.');
        } else if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.error('❌ FAILURE: Function not found or signature mismatch.');
        } else {
            console.error('❌ FAILURE: Unexpected error.');
        }
    } else {
        console.log('❓ Unexpected Success: Did it somehow find a user ID?');
    }
}

main();
