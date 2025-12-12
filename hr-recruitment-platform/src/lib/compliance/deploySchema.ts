/**
 * Compliance Schema Deployment Script
 * Deploys the compliance database schema to Supabase using the REST API
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase credentials
const SUPABASE_URL = 'https://niikshfoecitimepiifo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

// Note: To run DDL (CREATE TABLE, etc.), we need the service_role key
// The anon key can only do SELECT/INSERT/UPDATE/DELETE on existing tables
// 
// For now, let's create a simulated local test using the SQL files
// and provide instructions for manual deployment

console.log('═══════════════════════════════════════════════════════════════');
console.log('     COMPLIANCE SCHEMA DEPLOYMENT');
console.log('     NovumFlow & CareFlow Compliance System');
console.log('═══════════════════════════════════════════════════════════════\n');

// Read and validate SQL files
const schemaPath = path.join(__dirname, 'complianceSchema.sql');
const sampleDataPath = path.join(__dirname, 'sampleData.sql');

console.log('📁 Checking SQL files...\n');

if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const schemaLines = schemaContent.split('\n').length;
  console.log(`✅ complianceSchema.sql found (${schemaLines} lines)`);
  
  // Analyze schema content
  const createTableCount = (schemaContent.match(/CREATE TABLE IF NOT EXISTS/g) || []).length;
  const createTypeCount = (schemaContent.match(/CREATE TYPE/g) || []).length;
  const createViewCount = (schemaContent.match(/CREATE OR REPLACE VIEW/g) || []).length;
  const createFunctionCount = (schemaContent.match(/CREATE OR REPLACE FUNCTION/g) || []).length;
  const createIndexCount = (schemaContent.match(/CREATE INDEX IF NOT EXISTS/g) || []).length;
  
  console.log(`   - Tables: ${createTableCount}`);
  console.log(`   - Types/Enums: ${createTypeCount}`);
  console.log(`   - Views: ${createViewCount}`);
  console.log(`   - Functions: ${createFunctionCount}`);
  console.log(`   - Indexes: ${createIndexCount}`);
} else {
  console.log('❌ complianceSchema.sql NOT FOUND');
}

console.log('');

if (fs.existsSync(sampleDataPath)) {
  const sampleContent = fs.readFileSync(sampleDataPath, 'utf-8');
  const sampleLines = sampleContent.split('\n').length;
  console.log(`✅ sampleData.sql found (${sampleLines} lines)`);
  
  // Analyze sample data content
  const insertCount = (sampleContent.match(/INSERT INTO/g) || []).length;
  console.log(`   - INSERT statements: ${insertCount}`);
} else {
  console.log('❌ sampleData.sql NOT FOUND');
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('     DEPLOYMENT INSTRUCTIONS');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('To deploy the compliance schema to Supabase:\n');
console.log('OPTION 1: Using Supabase Dashboard (Recommended)');
console.log('─────────────────────────────────────────────────');
console.log('1. Go to: https://supabase.com/dashboard/project/niikshfoecitimepiifo/sql/new');
console.log('2. Copy the ENTIRE contents of:');
console.log('   src/lib/compliance/complianceSchema.sql');
console.log('3. Paste into the SQL Editor');
console.log('4. Click "Run" (or Ctrl+Enter)');
console.log('5. Wait for completion (should see success notices)');
console.log('');
console.log('6. Then copy the ENTIRE contents of:');
console.log('   src/lib/compliance/sampleData.sql');
console.log('7. Paste into the SQL Editor');
console.log('8. Click "Run"');
console.log('');
console.log('9. Run the test script again to verify:');
console.log('   npx tsx src/lib/compliance/testSchema.ts');
console.log('');

console.log('OPTION 2: Using Supabase CLI');
console.log('────────────────────────────');
console.log('# Install Supabase CLI if not already installed');
console.log('npm install -g supabase');
console.log('');
console.log('# Login to Supabase');
console.log('supabase login');
console.log('');
console.log('# Link to your project');
console.log('supabase link --project-ref niikshfoecitimepiifo');
console.log('');
console.log('# Run the migrations');
console.log('supabase db push');
console.log('');

console.log('OPTION 3: Using psql (if you have database URL)');
console.log('───────────────────────────────────────────────');
console.log('# Get your database URL from Supabase Dashboard > Settings > Database');
console.log('psql "postgresql://postgres:[PASSWORD]@db.niikshfoecitimepiifo.supabase.co:5432/postgres" < complianceSchema.sql');
console.log('psql "postgresql://postgres:[PASSWORD]@db.niikshfoecitimepiifo.supabase.co:5432/postgres" < sampleData.sql');
console.log('');

console.log('═══════════════════════════════════════════════════════════════');
console.log('     QUICK COPY COMMANDS');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Copy schema SQL to clipboard:');
console.log('  cat src/lib/compliance/complianceSchema.sql | pbcopy  # macOS');
console.log('  cat src/lib/compliance/complianceSchema.sql | xclip   # Linux');
console.log('');
console.log('Copy sample data SQL to clipboard:');
console.log('  cat src/lib/compliance/sampleData.sql | pbcopy       # macOS');
console.log('  cat src/lib/compliance/sampleData.sql | xclip        # Linux');
console.log('');

// Output the schema file content for easy copying
console.log('═══════════════════════════════════════════════════════════════');
console.log('     SCHEMA FILE LOCATION');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Full path to schema file:');
console.log(`  ${schemaPath}`);
console.log('');
console.log('Full path to sample data file:');
console.log(`  ${sampleDataPath}`);
console.log('');

// Create a combined file for convenience
const combinedPath = path.join(__dirname, 'DEPLOY_ALL.sql');
if (fs.existsSync(schemaPath) && fs.existsSync(sampleDataPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const sampleContent = fs.readFileSync(sampleDataPath, 'utf-8');
  
  const combined = `-- ═══════════════════════════════════════════════════════════════
-- COMBINED DEPLOYMENT FILE
-- Run this entire file in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- PART 1: SCHEMA
${schemaContent}

-- ═══════════════════════════════════════════════════════════════
-- PART 2: SAMPLE DATA
-- ═══════════════════════════════════════════════════════════════

${sampleContent}
`;
  
  fs.writeFileSync(combinedPath, combined);
  console.log('✅ Created combined deployment file:');
  console.log(`   ${combinedPath}`);
  console.log('');
  console.log('   You can copy this single file to deploy everything at once!');
}

console.log('\n═══════════════════════════════════════════════════════════════\n');
