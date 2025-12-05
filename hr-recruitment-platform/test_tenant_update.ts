import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kvtdyttgthbeomyvtmbj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
    console.error('Missing VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTenantUpdate() {
    console.log('Testing tenant update functionality...\n');

    // Step 1: Login as super admin
    console.log('Step 1: Logging in as super admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'mrsonirie@gmail.com',
        password: 'valentine12345'
    });

    if (authError) {
        console.error('Login failed:', authError);
        return;
    }

    console.log('✓ Logged in successfully as:', authData.user.email);
    console.log('User ID:', authData.user.id);

    // Step 2: Check if user is super admin
    console.log('\nStep 2: Checking super admin status...');
    const { data: profile, error: profileError } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
    }

    console.log('Profile:', profile);
    console.log('is_super_admin:', profile.is_super_admin);

    if (!profile.is_super_admin) {
        console.error('❌ User is not a super admin!');
        return;
    }

    console.log('✓ User is super admin');

    // Step 3: Get first tenant
    console.log('\nStep 3: Fetching tenants...');
    const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .limit(1);

    if (tenantsError) {
        console.error('Error fetching tenants:', tenantsError);
        return;
    }

    if (!tenants || tenants.length === 0) {
        console.error('❌ No tenants found');
        return;
    }

    const tenant = tenants[0];
    console.log('✓ Found tenant:', tenant.name);
    console.log('Tenant ID:', tenant.id);
    console.log('Current name:', tenant.name);

    // Step 4: Try to update tenant name
    console.log('\nStep 4: Attempting to update tenant name...');
    const newName = tenant.name + ' - TEST UPDATE ' + Date.now();
    console.log('New name:', newName);

    const { data: updateData, error: updateError } = await supabase
        .from('tenants')
        .update({
            name: newName,
            updated_at: new Date().toISOString()
        })
        .eq('id', tenant.id)
        .select();

    if (updateError) {
        console.error('❌ Update failed:', {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code
        });
        return;
    }

    console.log('✓ Update successful!');
    console.log('Updated data:', updateData);

    // Step 5: Verify the update
    console.log('\nStep 5: Verifying update...');
    const { data: verifyData, error: verifyError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenant.id)
        .single();

    if (verifyError) {
        console.error('Error verifying:', verifyError);
        return;
    }

    console.log('Verified tenant name:', verifyData.name);

    if (verifyData.name === newName) {
        console.log('✅ UPDATE SUCCESSFUL - Name was changed and persisted!');
    } else {
        console.log('❌ UPDATE FAILED - Name did not persist');
    }

    // Cleanup: Revert the name
    console.log('\nCleaning up: Reverting name...');
    await supabase
        .from('tenants')
        .update({ name: tenant.name })
        .eq('id', tenant.id);

    console.log('✓ Cleanup complete');
}

testTenantUpdate()
    .then(() => {
        console.log('\n✅ Test completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed with error:', error);
        process.exit(1);
    });
