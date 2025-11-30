
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyFix() {
    console.log('Verifying is_admin() function existence...');

    // Attempt to call the function. 
    // Even as anon, it should exist and return false (since anon is not admin).
    // If it throws "function not found", the migration wasn't applied.
    const { data, error } = await supabase.rpc('is_admin');

    if (error) {
        console.error('❌ Error calling is_admin:', error);
        if (error.message.includes('function') && error.message.includes('not found')) {
            console.error('❌ Function is_admin not found. Migration might not have been applied.');
        }
    } else {
        console.log('✅ is_admin() called successfully.');
        console.log('Result:', data); // Should be false for anon
    }
}

verifyFix();
