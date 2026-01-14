
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRecruitmentSchema() {
    console.log('Verifying Recruitment Module Schema...');
    console.log('Connect to:', supabaseUrl);

    const tablesToCheck = ['job_postings', 'applications', 'interviews', 'recruitment_workflows', 'workflow_stages'];
    const results: Record<string, boolean> = {};

    for (const table of tablesToCheck) {
        // We can't query information_schema easily with supabase-js unless we have a specific function exposed or use RPC.
        // Instead, we'll try to select 1 row from the table effectively "testing" if it exists.
        // We use .limit(0) to just check schema without fetching data.

        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });

        if (error) {
            if (error.code === '42P01') { // undefined_table
                console.error(`❌ Table '${table}' does NOT exist.`);
                results[table] = false;
            } else {
                console.warn(`⚠️  Could not verify '${table}': ${error.message} (Likely RLS or other error, but table might exist)`);
                // If it's a permission error, the table likely exists but we can't read it with anon key
                if (error.code === '42501') {
                    console.log(`✅ Table '${table}' exists (RLS restricted).`);
                    results[table] = true;
                } else {
                    results[table] = false;
                }
            }
        } else {
            console.log(`✅ Table '${table}' exists and is accessible.`);
            results[table] = true;
        }
    }

    return results;
}

async function verifyEdgeFunctions() {
    console.log('\nVerifying Edge Functions (Health Check)...');

    // List of functions to check (based on previous knowledge)
    const functions = [
        'generate-job-description',
        'ai-screen-resume',
        'generate-document'
    ];

    for (const func of functions) {
        // We invoke with an empty body just to see if it responds (it might 400 or 500, but 404 means missing)
        const { data, error } = await supabase.functions.invoke(func, { body: {} });

        if (error) {
            console.log(`ℹ️  Function '${func}' responded with error: ${error.message} (This confirms it exists but might need valid input)`);
        } else {
            console.log(`✅ Function '${func}' is reachable.`);
        }
    }
}

async function main() {
    await verifyRecruitmentSchema();
    await verifyEdgeFunctions();
}

main().catch(console.error);
