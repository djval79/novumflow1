import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niikshfoecitimepiifo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('🔍 Listing all tables in public schema...\n');

    // We can't query information_schema directly with supabase-js unless exposed via Rpc or if we have permissions.
    // However, we can try to "probe" for expected tables.

    const tablesToProbe = [
        'careflow_clients',
        'clients',
        'careflow_visits',
        'visits',
        'careflow_medications',
        'medications',
        'careflow_events',
        'events',
        'careflow_staff',
        'employees',
        'staff',
        'tenants'
    ];

    for (const table of tablesToProbe) {
        process.stdout.write(`Checking ${table}... `);
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true }).limit(1);

        if (!error) {
            console.log('✅ EXISTS');
        } else {
            if (error.code === '42P01') { // undefined_table
                console.log('❌ NOT FOUND');
            } else {
                console.log(`⚠️ ERROR: ${error.message} (${error.code})`);
            }
        }
    }
}

listTables().catch(console.error);
