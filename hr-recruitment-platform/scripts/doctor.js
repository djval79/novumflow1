/**
 * NovumFlow System Doctor
 * Run this to diagnose environment issues.
 */
import pg from 'pg';
import fetch from 'node-fetch';

const config = {
    db: "postgresql://postgres:phoneBobby1kennethMano@db.niikshfoecitimepiifo.supabase.co:5432/postgres",
    url: "https://niikshfoecitimepiifo.supabase.co",
    functions: [
        'automation-engine',
        'ai-screen-resume',
        'integration-manager',
        'send-email',
        'document-upload-enhanced'
    ],
    tables: [
        'tenants',
        'users_profiles',
        'applications',
        'job_postings',
        'recruitment_settings',
        'automation_rules',
        'automation_execution_logs',
        'expense_claims',
        'expense_categories'
    ]
};

async function diagnose() {
    console.log("🚀 Starting NovumFlow System Diagnosis...\n");

    const client = new pg.Client({
        connectionString: config.db,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // 1. Database Check
        await client.connect();
        console.log("✅ Database: Connected successfully.");

        console.log("\n📬 Checking Tables:");
        for (const table of config.tables) {
            const res = await client.query(`SELECT to_regclass('public.${table}') as exists`);
            if (res.rows[0].exists) {
                console.log(`  - ${table.padEnd(25)}: ✅ Exists`);
            } else {
                console.log(`  - ${table.padEnd(25)}: ❌ MISSING`);
            }
        }

        // 2. Edge Function Check
        console.log("\n⚡ Checking Edge Functions (Deployment Status):");
        for (const fn of config.functions) {
            try {
                const res = await fetch(`${config.url}/functions/v1/${fn}`, { method: 'OPTIONS' });
                if (res.status === 200 || res.status === 204) {
                    console.log(`  - ${fn.padEnd(25)}: ✅ Deployed`);
                } else if (res.status === 404) {
                    console.log(`  - ${fn.padEnd(25)}: ❌ NOT DEPLOYED (404)`);
                } else {
                    console.log(`  - ${fn.padEnd(25)}: ⚠️ Error ${res.status}`);
                }
            } catch (e) {
                console.log(`  - ${fn.padEnd(25)}: ❌ Unreachable`);
            }
        }

        // 3. Storage Check
        // (This is harder to check without a service role key via REST, but we can assume if 404s are happening on functions, storage might need a check too)

    } catch (err) {
        console.error("\n❌ Fatal Error during diagnosis:", err.message);
    } finally {
        await client.end();
        console.log("\n🏁 Diagnosis Complete.");
    }
}

diagnose();
