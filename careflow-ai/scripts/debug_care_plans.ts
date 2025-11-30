
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🔍 Debugging Care Plans Table...');

    // Query information_schema to see if table and column exist
    // We can't query information_schema directly via supabase-js easily without RLS or an RPC.
    // But we can try to just insert into the table and see the error.

    console.log('Attempting to insert into care_plans...');

    // We need a valid tenant and client first
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    const { data: client } = await supabase.from('clients').select('id').eq('tenant_id', tenant.id).limit(1).single();

    if (!tenant || !client) {
        console.log('Skipping insert (no tenant/client)');
        return;
    }

    const { data, error } = await supabase
        .from('care_plans')
        .insert({
            tenant_id: tenant.id,
            client_id: client.id,
            summary: 'Debug Plan',
            tasks: []
        })
        .select();

    if (error) {
        console.error('❌ Insert Error:', error);
        console.log('Error Code:', error.code);
        console.log('Error Message:', error.message);
        console.log('Error Details:', error.details);
    } else {
        console.log('✅ Insert Successful:', data);
        // Cleanup
        await supabase.from('care_plans').delete().eq('id', data[0].id);
    }
}

main();
