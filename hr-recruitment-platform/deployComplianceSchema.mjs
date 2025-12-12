/**
 * Deploy Compliance Schema to Supabase via Direct PostgreSQL Connection
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase PostgreSQL connection string
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
const SUPABASE_PROJECT_REF = 'niikshfoecitimepiifo';
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || 'YOUR_DB_PASSWORD';

// Connection using service role through PostgREST proxy won't work for DDL
// We need direct DB access or use the Supabase SQL API

const SUPABASE_URL = 'https://niikshfoecitimepiifo.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA1MjIxNSwiZXhwIjoyMDc4NjI4MjE1fQ.sPu18Bb90PKUL_rTDLK6MPvgpS1FfduWq4H0xoNWlA8';

async function executeViaSupabaseAPI(sql) {
  // Try using the Supabase query endpoint (if available)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });
  
  return response;
}

async function checkExistingTables() {
  console.log('🔍 Checking existing tables...\n');
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/compliance_persons?select=id&limit=1`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  });
  
  if (response.ok) {
    console.log('✅ compliance_persons table exists');
    return true;
  } else if (response.status === 404) {
    console.log('❌ compliance_persons table does not exist');
    return false;
  } else {
    const text = await response.text();
    console.log(`Response: ${response.status} - ${text}`);
    return false;
  }
}

async function checkAllTables() {
  const tables = [
    'compliance_persons',
    'compliance_documents', 
    'compliance_document_types',
    'compliance_folders',
    'compliance_checklists',
    'compliance_tasks',
    'compliance_notifications',
    'compliance_audit_log'
  ];
  
  const results = {};
  
  for (const table of tables) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    
    results[table] = response.ok || response.status === 200;
    console.log(`  ${results[table] ? '✅' : '❌'} ${table}`);
  }
  
  return results;
}

async function insertTestData() {
  console.log('\n📝 Attempting to insert test data...\n');
  
  // Try to insert a test tenant first
  const tenantResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=representation,resolution=merge-duplicates'
    },
    body: JSON.stringify({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Default Organization',
      slug: 'default',
      is_active: true
    })
  });
  
  if (tenantResponse.ok) {
    console.log('✅ Default tenant created/exists');
  } else {
    const text = await tenantResponse.text();
    console.log(`Tenant response: ${tenantResponse.status} - ${text.substring(0, 200)}`);
  }
  
  return tenantResponse.ok || tenantResponse.status === 409;
}

async function main() {
  console.log('='.repeat(60));
  console.log('🔧 COMPLIANCE SCHEMA DEPLOYMENT CHECK');
  console.log('='.repeat(60));
  console.log(`Target: ${SUPABASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  
  // Check what tables exist
  console.log('\n📋 Checking table status:\n');
  const tableStatus = await checkAllTables();
  
  const allExist = Object.values(tableStatus).every(v => v);
  const noneExist = Object.values(tableStatus).every(v => !v);
  
  if (allExist) {
    console.log('\n✅ All compliance tables exist! Schema is deployed.');
    console.log('\nYou can now run the sample data if needed.');
  } else if (noneExist) {
    console.log('\n❌ No compliance tables found.');
    console.log('\n' + '='.repeat(60));
    console.log('📥 MANUAL DEPLOYMENT REQUIRED');
    console.log('='.repeat(60));
    console.log('\nSupabase REST API cannot execute CREATE TABLE statements.');
    console.log('You must run the SQL manually.\n');
    console.log('Option 1 - Supabase SQL Editor:');
    console.log('  1. Go to: https://supabase.com/dashboard/project/niikshfoecitimepiifo/sql/new');
    console.log('  2. Copy & paste the SQL from complianceSchema.sql');
    console.log('  3. Click "Run"\n');
    console.log('Option 2 - Download & Upload:');
    console.log('  Download: https://8888-itb71nx7a4o65vu7gltti-5185f4aa.sandbox.novita.ai/COMPLIANCE_DEPLOY_COMPLETE.sql');
  } else {
    console.log('\n⚠️  Partial schema detected. Some tables missing.');
    console.log('You may need to re-run the schema.');
  }
  
  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
