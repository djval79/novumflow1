
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
        if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
    });
}

if (!supabaseUrl || !supabaseKey) {
    // Try production env as fallback
    const prodEnv = path.join(__dirname, '../../.env.production');
    if (fs.existsSync(prodEnv)) {
        const envContent = fs.readFileSync(prodEnv, 'utf8');
        envContent.split('\n').forEach(line => {
            if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
            if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
        });
    }
}

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL/Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const email = 'e2e.test@novumflow.com';
    const password = 'TestPassword123!';

    console.log(`Trying to login as ${email}...`);
    let { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.log(`Login failed:`, loginError);
        console.log(`Login failed message: ${loginError.message}. Attempting signup...`);

        // Attempt signup
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: 'E2E Test User',
                    role: 'admin' // Some setups might use metadata for roles
                }
            }
        });

        if (signUpError) {
            console.error('❌ Signup failed:', signUpError.message);
            // If user exists but login failed, maybe password changed?
            // Try a different user?
            process.exit(1);
        }

        if (signUpData.session) {
            console.log('✅ Signup successful and session obtained!');
            session = signUpData.session;
        } else if (signUpData.user) {
            console.log('⚠️ Signup successful but Email Confirmation Required.');
            console.log('   Please check email or manually confirm user in Supabase dashboard.');
            process.exit(0);
        }
    } else {
        console.log('✅ Login successful!');
    }

    if (!session) {
        console.error('❌ No session established.');
        process.exit(1);
    }

    // Check tenants
    console.log('Checking tenants...');

    // Need to call a function or check memberships
    // We can try to list tenants we are member of
    const { data: memberships, error: memberError } = await supabase
        .from('user_tenant_memberships')
        .select('tenant_id')
        .eq('user_id', session.user.id);

    let tenantIds = (memberships || []).map(m => m.tenant_id);

    if (tenantIds.length === 0) {
        console.log('No tenants found. Creating a new tenant...');

        // Try to create a tenant using the RPC function if it exists, or insert if valid
        // Service normally uses RPC `create_tenant`

        const { data: newTenant, error: createError } = await supabase.rpc('create_tenant', {
            p_name: 'E2E Test Tenant',
            p_subdomain: 'e2e-test',
            p_owner_user_id: session.user.id
        });

        if (createError) {
            console.log('RPC create_tenant failed:', createError.message);
            console.log('Trying direct insert (fallback)...');

            // Direct insert fallback
            const { data: insertData, error: insertError } = await supabase
                .from('tenants')
                .insert({
                    name: 'E2E Test Tenant',
                    subscription_tier: 'basic',
                    created_by: session.user.id
                })
                .select()
                .single();

            if (insertError) {
                console.error('❌ Failed to create tenant:', insertError);
                process.exit(1);
            }

            console.log('✅ Tenant created via direct insert:', insertData.id);
            tenantIds = [insertData.id];
        } else {
            console.log('✅ Tenant created via RPC:', newTenant.id);
            tenantIds = [newTenant.id];
        }
    }

    // Now enable CareFlow
    const { data: tenants, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .in('id', tenantIds);

    if (fetchError) {
        console.error('Error fetching tenants:', fetchError);
        process.exit(1);
    }

    for (const tenant of tenants) {
        console.log(`Processing tenant: ${tenant.name}`);

        // Update careflow_enabled
        const { error: updateError } = await supabase
            .from('tenants')
            .update({ careflow_enabled: true })
            .eq('id', tenant.id);

        if (updateError) {
            console.log('Failed to update careflow_enabled column:', updateError.message);
            console.log('Attempting to update settings JSONB...');

            const settings = tenant.settings || {};
            settings.careflow_enabled = true;

            const { error: settingsError } = await supabase
                .from('tenants')
                .update({ settings })
                .eq('id', tenant.id);

            if (settingsError) {
                console.error('❌ Failed to update settings too:', settingsError.message);
            } else {
                console.log('✅ Enabled CareFlow in settings!');
            }
        } else {
            console.log('✅ Enabled CareFlow in column!');
        }
    }
}

main();
