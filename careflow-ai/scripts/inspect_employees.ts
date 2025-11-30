
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niikshfoecitimepiifo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🔍 Inspecting Employees Table...');

    // Try to fetch one record
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error fetching employees:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Found record. Keys:', Object.keys(data[0]));
    } else {
        console.log('⚠️ Table is empty. Cannot inspect keys from data.');
        // Try to insert a dummy record to see what fails? 
        // Or just try to select specific columns to see which one errors.

        console.log('Trying to select "full_name"...');
        const { error: fnError } = await supabase.from('employees').select('full_name').limit(1);
        if (!fnError) console.log('✅ "full_name" exists.');
        else console.log('❌ "full_name" does NOT exist.');

        console.log('Trying to select "name"...');
        const { error: nError } = await supabase.from('employees').select('name').limit(1);
        if (!nError) console.log('✅ "name" exists.');
        else console.log('❌ "name" does NOT exist.');
    }
}

main();
