
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), 'hr-recruitment-platform', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkColumns() {
    console.log('🧪 Testing specific columns in careflow_medications...');

    const { data, error } = await supabase
        .from('careflow_medications')
        .select('instructions, stock_level, ai_safety_summary')
        .limit(1);

    if (error) {
        console.error('❌ Column check failed:', error.message);
    } else {
        console.log('✅ Critical columns (instructions, stock_level, ai_safety_summary) are present.');
    }

    console.log('\n🧪 Testing hydration table name...');
    const { error: hydrationError } = await supabase
        .from('careflow_hydration')
        .select('amount_ml')
        .limit(1);

    if (hydrationError) {
        console.error('❌ Hydration table check failed:', hydrationError.message);
    } else {
        console.log('✅ Hydration table (careflow_hydration) is present and amount_ml is accessible.');
    }
}

checkColumns();
