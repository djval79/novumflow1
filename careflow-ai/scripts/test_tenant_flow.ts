
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🚀 Starting Tenant Flow Verification...');

    // 1. Get a User ID to act as Owner
    // We'll use the first user we find
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError || !users.users.length) {
        console.error('❌ Failed to get users:', userError);
        return;
    }
    const ownerId = users.users[0].id;
    console.log(`👤 Using User ID: ${ownerId} as Owner`);

    // 2. Test Create Tenant RPC
    const tenantName = `Test Tenant ${Date.now()}`;
    const subdomain = `test-${Date.now()}`;
    console.log(`\n🏢 Creating Tenant: ${tenantName} (${subdomain})...`);

    const { data: tenant, error: createError } = await supabase.rpc('create_tenant', {
        p_name: tenantName,
        p_subdomain: subdomain,
        p_owner_user_id: ownerId
    });

    if (createError) {
        console.error('❌ Create Tenant Failed:', createError);
        return;
    }

    console.log('✅ Tenant Created Successfully!');
    console.log('   ID:', tenant.id);
    console.log('   Name:', tenant.name);

    // 3. Verify Membership
    const { data: membership, error: memError } = await supabase
        .from('user_tenant_memberships')
        .select('*')
        .eq('user_id', ownerId)
        .eq('tenant_id', tenant.id)
        .single();

    if (memError || !membership) {
        console.error('❌ Owner membership not found:', memError);
    } else {
        console.log('✅ Owner Membership Verified:', membership.role);
    }

    // 4. Test Invite User RPC
    const inviteEmail = `invitee.${Date.now()}@example.com`;
    console.log(`\nMw Inviting User: ${inviteEmail}...`);

    // Note: We need to call this RPC as a user who has permission (the owner).
    // Since we are using service role key, we bypass RLS, but the RPC checks `public.has_tenant_role`.
    // `public.has_tenant_role` checks `auth.uid()`.
    // When using service role key, `auth.uid()` is null or special.
    // We might need to temporarily bypass the check or mock the session.
    // OR, we can just insert into the table directly to verify the table structure and RLS policies (if we were acting as a user).

    // Let's try calling the RPC. If it fails due to permissions, we know the permission check is working (which is good!).
    // But for verification, we want to ensure the logic works.

    // Actually, `has_tenant_role` might return false for service role if not handled.
    // Let's see what happens.

    const { data: inviteId, error: inviteError } = await supabase.rpc('invite_user_to_tenant', {
        p_email: inviteEmail,
        p_role: 'carer',
        p_tenant_id: tenant.id
    });

    if (inviteError) {
        console.log('⚠️ Invite RPC failed (Expected if auth.uid() is missing):', inviteError.message);

        // If it failed due to permissions, let's try direct insert to verify table constraints
        console.log('   Attempting direct insert (Service Role override)...');
        const { data: directInvite, error: directError } = await supabase
            .from('tenant_invitations')
            .insert({
                tenant_id: tenant.id,
                email: inviteEmail,
                role: 'carer',
                invited_by: ownerId, // Simulate owner
                token: `test-token-${Date.now()}` // Provide token (TEXT)
            })
            .select()
            .single();

        if (directError) {
            console.error('❌ Direct Insert Failed:', directError);
        } else {
            console.log('✅ Direct Invite Inserted Successfully!');
            console.log('   Token:', directInvite.token);
        }

    } else {
        console.log('✅ Invite RPC Succeeded!');
    }

}

main();
