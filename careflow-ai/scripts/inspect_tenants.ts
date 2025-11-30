
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🔍 Inspecting Tenants Table Constraints...');

    // We can't easily query pg_catalog via the JS client unless we have a function for it.
    // But we can try to insert a dummy row with a random string to see the error message, 
    // which might list allowed values if it's a check constraint.

    const tenantName = `Probe Tenant ${Date.now()}`;
    const subdomain = `probe-${Date.now()}`;

    console.log('Attempting insert with "INVALID_TIER"...');
    const { error } = await supabase.from('tenants').insert({
        name: tenantName,
        slug: subdomain,
        subdomain: subdomain,
        subscription_tier: 'INVALID_TIER'
    });

    if (error) {
        console.log('❌ Insert failed:');
        console.log('   Message:', error.message);
        // Sometimes the message says "check constraint ... failed: row contains ..."
        // It might not list allowed values.
    }

    // Let's try to fetch one row and see what the tier is
    const { data: tenant } = await supabase.from('tenants').select('subscription_tier').limit(1).single();
    if (tenant) {
        console.log('✅ Found existing tenant tier:', tenant.subscription_tier);
    }
}

main();
