
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🕵️ Probing Employees Table...');

    // 1. Get a Tenant ID
    let { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) {
        // Create one if needed
        const { data: newTenant } = await supabase.from('tenants').insert({ name: 'Probe Tenant', slug: 'probe', subdomain: 'probe' }).select().single();
        tenant = newTenant;
    }

    if (!tenant) {
        console.error('❌ Could not get tenant.');
        return;
    }

    // 2. Try to insert WITHOUT 'name'
    // If 'name' exists and is NOT NULL, this should fail with a specific DB error.
    console.log('Attempting insert without "name"...');
    const { error } = await supabase.from('employees').insert({
        tenant_id: tenant.id,
        role: 'Carer'
        // name is missing
    });

    if (error) {
        console.log('❌ Insert failed (as expected/hoped):');
        console.log('   Message:', error.message);
        console.log('   Details:', error.details);
        console.log('   Hint:', error.hint);

        if (error.message.includes('name') && error.message.includes('null value')) {
            console.log('✅ CONFIRMED: Column "name" exists and is NOT NULL.');
        } else if (error.message.includes('Could not find')) {
            console.log('⚠️ Still getting Schema Cache error. The column is invisible to the API.');
        }
    } else {
        console.log('✅ Insert SUCCEEDED? This means "name" is nullable or has a default, or does not exist (and we inserted into a table with different columns).');
    }
}

main();
