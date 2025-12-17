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

async function checkTables() {
    try {
        await client.connect();
        const res = await client.query("SELECT to_regclass('public.tenant_features')");
        console.log("tenant_features exists:", res.rows[0].to_regclass);

        const res2 = await client.query("SELECT * FROM features");
        console.log("Features count:", res2.rowCount);
        console.log("Features:", res2.rows.map(r => r.name));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

checkTables();
