
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🕵️ Probing Clients Table...');

    // 1. Get a Tenant ID
    let { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) {
        console.error('❌ Could not get tenant.');
        return;
    }

    // 2. Try to insert WITHOUT 'name' (assuming it might be first_name)
    console.log('Attempting insert without "name"...');
    const { error } = await supabase.from('clients').insert({
        tenant_id: tenant.id,
        status: 'Active'
        // name is missing
    });

    if (error) {
        console.log('❌ Insert failed:');
        console.log('   Message:', error.message);

        if (error.message.includes('first_name') && error.message.includes('null value')) {
            console.log('✅ CONFIRMED: Column "first_name" exists and is NOT NULL.');
        } else if (error.message.includes('name') && error.message.includes('null value')) {
            console.log('✅ CONFIRMED: Column "name" exists and is NOT NULL.');
        } else {
            console.log('⚠️ Other error:', error.message);
        }
    }
}

main();
