import { createClient } from '@supabase/supabase-js';

// INSTRUCTIONS:
// 1. Run this script ensuring 044_enforce_careflow_rls.sql has been applied.
// 2. You will need two valid user accounts (email/password) that belong to DISTINCT tenants.
// 3. Edit the credentials below before running.

const supabaseUrl = 'https://niikshfoecitimepiifo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

// USER A (Tenant A)
const USER_A = {
    email: 'user.a@example.com',
    password: 'securepassword123'
};

// USER B (Tenant B)
const USER_B = {
    email: 'user.b@example.com',
    password: 'securepassword123'
};

async function testIsolation() {
    console.log('🔒 Starting RLS Isolation Verification...\n');

    // 1. Authenticate User A
    console.log(`🔑 Authenticating User A (${USER_A.email})...`);
    const clientA = createClient(supabaseUrl, supabaseKey);
    const { data: { session: sessionA }, error: authErrorA } = await clientA.auth.signInWithPassword(USER_A);

    if (authErrorA) {
        console.error('❌ User A Login Failed:', authErrorA.message);
        return;
    }
    console.log('✅ User A Logged In');

    // 2. Create Data as User A
    console.log('\n📝 User A creating a test visit...');
    // We assume 'careflow_visits' exists and User A has access to their tenant
    // We need to fetch User A's tenant first
    const { data: tenantAData } = await clientA.rpc('get_my_tenants');
    const tenantAId = tenantAData[0]?.id;
    console.log(`   Tenant ID: ${tenantAId}`);

    if (!tenantAId) {
        console.error('❌ User A has no tenant!');
        return;
    }

    // Insert a visit
    const { data: visitA, error: createError } = await clientA
        .from('careflow_visits')
        .insert([{
            tenant_id: tenantAId,
            status: 'Scheduled',
            visit_type: 'Test Isolation',
            notes: 'SECRET_DATA_USER_A'
        }])
        .select()
        .single();

    if (createError) {
        console.error('❌ User A failed to create data:', createError.message);
        return;
    }
    console.log(`✅ Created Visit ID: ${visitA.id}`);


    // 3. Authenticate User B
    console.log(`\n🔑 Authenticating User B (${USER_B.email})...`);
    const clientB = createClient(supabaseUrl, supabaseKey);
    const { data: { session: sessionB }, error: authErrorB } = await clientB.auth.signInWithPassword(USER_B);

    if (authErrorB) {
        console.error('❌ User B Login Failed:', authErrorB.message);
        return;
    }
    console.log('✅ User B Logged In');


    // 4. User B tries to read User A's data
    console.log(`\n🕵️ User B trying to access Visit ID: ${visitA.id}...`);
    const { data: leakData, error: leakError } = await clientB
        .from('careflow_visits')
        .select('*')
        .eq('id', visitA.id)
        .single();

    if (leakData) {
        console.error('🚨 SECURITY FAILURE! User B read User A\'s data!');
        console.error('   Data:', leakData);
    } else {
        // We expect an error or null/empty because of RLS
        console.log('✅ Success! Data returned is null/empty.');
        if (leakError) {
            console.log(`   (Supabase returned error: ${leakError.message} - This is also acceptable if RLS policy denies access)`);
        }
    }

    // Clean up? (User A deletes their data)
}

// Note: Ensure users exist before running.
// testIsolation().catch(console.error);
console.log("Please edit the script with valid credentials before running.");
