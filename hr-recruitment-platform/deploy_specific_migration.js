import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_HOST = "db.niikshfoecitimepiifo.supabase.co";
const DB_PORT = 5432;
const DB_NAME = "postgres";
const DB_USER = "postgres";
const DB_PASSWORD = "phoneBobby1kennethMano";

const connectionString = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

const client = new pg.Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function deploy() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Please provide the migration filename as an argument. e.g. node deploy_specific_migration.js add_company_settings.sql");
        process.exit(1);
    }

    const migrationFileName = args[0];
    const migrationPath = path.join(__dirname, 'migrations', migrationFileName);

    if (!fs.existsSync(migrationPath)) {
        console.error(`Migration file not found: ${migrationPath}`);
        process.exit(1);
    }

    try {
        console.log(`Connecting to Supabase PostgreSQL for: ${migrationFileName}...`);
        await client.connect();
        console.log("Connected successfully!");

        console.log(`Reading migration from: ${migrationPath}`);
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log("Executing migration...");
        const res = await client.query(migrationSql);

        if (Array.isArray(res)) {
            res.forEach((r, i) => {
                if (r.rows && r.rows.length > 0) {
                    console.log(`Result set ${i}:`, r.rows);
                }
            });
        } else if (res.rows && res.rows.length > 0) {
            console.log("Result:", res.rows);
        }

        console.log(`✅ Migration ${migrationFileName} executed successfully!`);

    } catch (err) {
        console.error("Error executing migration:", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

deploy();
