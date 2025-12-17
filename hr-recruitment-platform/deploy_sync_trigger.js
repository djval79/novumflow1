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
    try {
        console.log("Connecting to Supabase PostgreSQL...");
        await client.connect();
        console.log("Connected successfully!");

        const migrationPath = path.join(__dirname, 'migrations', 'sync_tenant_features.sql');
        console.log(`Reading migration from: ${migrationPath}`);
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log("Executing migration...");
        await client.query(migrationSql);
        console.log("Migration executed successfully!");

    } catch (err) {
        console.error("Error executing migration:", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

deploy();
