
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables from .env if present (simple parser)
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

// Check for .env.production if local not found
if (!supabaseUrl) {
    const prodEnv = path.join(__dirname, '../../.env.production');
    if (fs.existsSync(prodEnv)) {
        console.log('Using .env.production');
        const envContent = fs.readFileSync(prodEnv, 'utf8');
        envContent.split('\n').forEach(line => {
            if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
            if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
        });
    }
}

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Could not find VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env files.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log('🧪 NovumFlow -> CareFlow Sync Verification Tool');
    console.log('==============================================');
    console.log(`URL: ${supabaseUrl}`);

    const email = await question('Enter Admin Email: ');
    const password = await question('Enter Password: ');

    console.log('\nLogging in...');
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError || !session) {
        console.error('❌ Login failed:', authError?.message);
        process.exit(1);
    }

    console.log('✅ Logged in successfully.');
    const token = session.access_token;

    // 1. Get Tenants
    console.log('\nFetching Tenant...');
    const { data: memberships } = await supabase
        .from('user_tenant_memberships')
        .select('tenant_id, tenants(name)')
        .eq('user_id', session.user.id)
        .eq('is_active', true);

    if (!memberships || memberships.length === 0) {
        console.error('❌ No active tenant found for this user.');
        process.exit(1);
    }

    const tenantId = memberships[0].tenant_id;
    const tenantName = memberships[0].tenants.name;
    console.log(`✅ Using Tenant: ${tenantName} (${tenantId})`);

    // 2. Get Employees
    console.log('\nFetching Employees from NovumFlow...');
    const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('tenant_id', tenantId)
        .limit(1);

    if (!employees || employees.length === 0) {
        console.log('⚠️ No employees found in NovumFlow to sync.');
        console.log('   Please create an employee in the web interface first.');
        process.exit(0);
    }

    const employee = employees[0];
    console.log(`✅ Found Employee: ${employee.first_name} ${employee.last_name} (${employee.id})`);

    // 3. Call Sync Function
    console.log('\n🚀 Invoking Sync Function...');
    const { data: syncResult, error: syncError } = await supabase.functions.invoke('sync-to-careflow', {
        body: {
            employee_id: employee.id,
            tenant_id: tenantId,
            action: 'sync'
        }
    });

    if (syncError) {
        console.error('❌ Sync Function Failed:', syncError);
        console.log('   Ensure the function is deployed and you have permission.');
    } else {
        console.log('✅ Sync Function Success:', syncResult);
    }

    // 4. Verify in CareFlow Table
    console.log('\n🔍 Verifying in CareFlow Staff table...');
    const { data: careflowStaff, error: cfError } = await supabase
        .from('careflow_staff')
        .select('*')
        .eq('novumflow_employee_id', employee.id)
        .eq('tenant_id', tenantId);

    if (cfError) {
        console.error('❌ Verification Query Failed:', cfError.message);
    } else if (careflowStaff && careflowStaff.length > 0) {
        console.log('✅ SUCCESS! Employee found in CareFlow Staff:');
        console.log(careflowStaff[0]);
    } else {
        console.error('❌ Employee NOT found in CareFlow Staff table after sync.');
    }

    rl.close();
}

main().catch(console.error);
