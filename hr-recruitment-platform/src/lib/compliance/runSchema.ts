/**
 * Run Compliance Schema on Supabase
 * Uses service_role key to execute DDL commands
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://niikshfoecitimepiifo.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA1MjIxNSwiZXhwIjoyMDc4NjI4MjE1fQ.sPu18Bb90PKUL_rTDLK6MPvgpS1FfduWq4H0xoNWlA8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSQL(sql: string, description: string): Promise<boolean> {
  console.log(`\n📦 Running: ${description}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try direct REST API if RPC doesn't exist
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ sql_query: sql })
      });
      
      if (!response.ok) {
        // Fallback: Use the SQL endpoint directly
        throw new Error(`RPC not available: ${error.message}`);
      }
    }
    
    console.log(`✅ ${description} completed`);
    return true;
  } catch (err: any) {
    console.error(`❌ Error in ${description}:`, err.message);
    return false;
  }
}

async function executeSQLViaPgREST(sql: string): Promise<{ success: boolean; error?: string }> {
  // Supabase doesn't have a direct SQL execution endpoint via REST
  // We need to use the Management API or execute via PostgREST functions
  
  // Alternative: Use pg directly if available, or chunk the SQL
  console.log('Attempting to execute SQL...');
  
  // For DDL, we need to use Supabase Management API
  const managementUrl = `https://api.supabase.com/v1/projects/niikshfoecitimepiifo/database/query`;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: text };
    }
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function createTablesIndividually() {
  console.log('🚀 Creating compliance tables individually...\n');
  
  // 1. Create extension
  const ext = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
  
  // 2. Create enums
  const enums = `
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_authority') THEN
        CREATE TYPE compliance_authority AS ENUM ('HOME_OFFICE', 'CQC', 'BOTH', 'INTERNAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_stage') THEN
        CREATE TYPE compliance_stage AS ENUM ('APPLICATION', 'PRE_EMPLOYMENT', 'ONBOARDING', 'ONGOING', 'OFFBOARDING');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM ('PENDING', 'UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'EXPIRING_SOON', 'NOT_APPLICABLE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgency_level') THEN
        CREATE TYPE urgency_level AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_person_type') THEN
        CREATE TYPE compliance_person_type AS ENUM ('APPLICANT', 'CANDIDATE', 'NEW_HIRE', 'EMPLOYEE', 'FORMER_EMPLOYEE');
    END IF;
END $$;
`;

  // Test connection first
  const { data: testData, error: testError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);
    
  if (testError && testError.code !== 'PGRST116') {
    console.log('Connection test:', testError.message);
  } else {
    console.log('✅ Connected to Supabase successfully');
  }
  
  // Try to check if tables exist
  const { data: tables, error: tablesError } = await supabase
    .from('compliance_persons')
    .select('id')
    .limit(1);
    
  if (!tablesError) {
    console.log('⚠️  compliance_persons table already exists!');
    console.log('Schema may already be deployed. Checking other tables...');
    
    const { error: docsError } = await supabase.from('compliance_documents').select('id').limit(1);
    const { error: typesError } = await supabase.from('compliance_document_types').select('id').limit(1);
    
    if (!docsError && !typesError) {
      console.log('✅ All core tables exist. Schema is already deployed!');
      return true;
    }
  }
  
  console.log('\n📋 Tables need to be created.');
  console.log('Since Supabase REST API cannot execute DDL directly,');
  console.log('please run the SQL file manually in the Supabase SQL Editor.\n');
  
  return false;
}

async function main() {
  console.log('='.repeat(60));
  console.log('🔧 COMPLIANCE SCHEMA DEPLOYMENT');
  console.log('='.repeat(60));
  console.log(`Target: ${SUPABASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  
  const result = await createTablesIndividually();
  
  if (!result) {
    console.log('\n' + '='.repeat(60));
    console.log('📥 MANUAL DEPLOYMENT REQUIRED');
    console.log('='.repeat(60));
    console.log('\nThe Supabase REST API cannot execute CREATE TABLE statements.');
    console.log('Please use one of these methods:\n');
    console.log('1. Supabase SQL Editor (recommended):');
    console.log('   https://supabase.com/dashboard/project/niikshfoecitimepiifo/sql/new');
    console.log('   Copy contents of: src/lib/compliance/complianceSchema.sql');
    console.log('   Then: src/lib/compliance/sampleData.sql\n');
    console.log('2. Download combined file:');
    console.log('   https://8888-itb71nx7a4o65vu7gltti-5185f4aa.sandbox.novita.ai/COMPLIANCE_DEPLOY_COMPLETE.sql');
    console.log('\n' + '='.repeat(60));
  }
}

main().catch(console.error);
