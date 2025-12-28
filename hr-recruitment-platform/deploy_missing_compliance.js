import pg from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = 'postgresql://postgres:phoneBobby1kennethMano@db.niikshfoecitimepiifo.supabase.co:5432/postgres';

async function runMigration() {
    const client = new pg.Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const migrationPath = '/Users/apple/Library/Mobile Documents/com~apple~CloudDocs/Projects/NovumFlow/novumflow1/hr-recruitment-platform/migrations/add_missing_compliance_tables.sql';
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        await client.query(sql);
        console.log('Migration completed successfully');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
