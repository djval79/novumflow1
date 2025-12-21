
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niikshfoecitimepiifo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTenants() {
    console.log('Fetching tenants...');
    const { data, error } = await supabase.from('tenants').select('id, name, slug');
    if (error) {
        console.error('Error fetching tenants:', error);
        return;
    }
    console.log('Tenants:', data);
}

checkTenants();
