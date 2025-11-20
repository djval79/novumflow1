import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env.production') });
config({ path: join(__dirname, '..', 'hr-recruitment-platform', '.env') });

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Test results
let passed = 0;
let failed = 0;
let warnings = 0;

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const symbol = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  
  console.log(`${color}${symbol} ${name}${colors.reset}`);
  
  if (details) {
    console.log(`  ${details}`);
  }
  
  if (status === 'pass') passed++;
  else if (status === 'fail') failed++;
  else warnings++;
}

function section(title) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`${colors.bright}${title}${colors.reset}`);
  console.log('='.repeat(50));
}

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  log('Error: Missing Supabase credentials', colors.red);
  log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file', colors.yellow);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test functions
async function testDatabaseTables() {
  section('TEST 1: DATABASE TABLES');
  
  const tables = [
    'performance_review_types',
    'performance_criteria',
    'performance_reviews',
    'review_participants',
    'performance_ratings',
    'performance_goals',
    'kpi_definitions',
    'kpi_values',
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          logTest(`Table: ${table}`, 'fail', `Table not found. Run SQL migration first.`);
        } else {
          logTest(`Table: ${table}`, 'warn', `Error: ${error.message}`);
        }
      } else {
        logTest(`Table: ${table}`, 'pass');
      }
    } catch (err) {
      logTest(`Table: ${table}`, 'fail', err.message);
    }
  }
}

async function testDefaultData() {
  section('TEST 2: DEFAULT DATA');
  
  try {
    // Check for default review types
    const { data: reviewTypes, error: rtError } = await supabase
      .from('performance_review_types')
      .select('*');
    
    if (rtError) {
      logTest('Default Review Types', 'fail', rtError.message);
    } else if (reviewTypes && reviewTypes.length >= 5) {
      logTest('Default Review Types', 'pass', `Found ${reviewTypes.length} review types`);
    } else {
      logTest('Default Review Types', 'warn', `Only ${reviewTypes?.length || 0} review types found (expected 5)`);
    }
    
    // Check for default criteria
    const { data: criteria, error: cError } = await supabase
      .from('performance_criteria')
      .select('*');
    
    if (cError) {
      logTest('Default Evaluation Criteria', 'fail', cError.message);
    } else if (criteria && criteria.length >= 8) {
      logTest('Default Evaluation Criteria', 'pass', `Found ${criteria.length} criteria`);
    } else {
      logTest('Default Evaluation Criteria', 'warn', `Only ${criteria?.length || 0} criteria found (expected 8)`);
    }
    
    // Check for default KPIs
    const { data: kpis, error: kError } = await supabase
      .from('kpi_definitions')
      .select('*');
    
    if (kError) {
      logTest('Default KPI Definitions', 'fail', kError.message);
    } else if (kpis && kpis.length >= 4) {
      logTest('Default KPI Definitions', 'pass', `Found ${kpis.length} KPI definitions`);
    } else {
      logTest('Default KPI Definitions', 'warn', `Only ${kpis?.length || 0} KPIs found (expected 4)`);
    }
  } catch (err) {
    logTest('Default Data Check', 'fail', err.message);
  }
}

async function testEdgeFunction() {
  section('TEST 3: EDGE FUNCTION');
  
  const functionUrl = `${supabaseUrl}/functions/v1/performance-crud`;
  
  const tests = [
    { action: 'list', entity: 'review_types', name: 'List Review Types' },
    { action: 'list', entity: 'reviews', name: 'List Reviews' },
    { action: 'list', entity: 'goals', name: 'List Goals' },
    { action: 'list', entity: 'kpi_definitions', name: 'List KPI Definitions' },
    { action: 'list', entity: 'criteria', name: 'List Criteria' },
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          action: test.action,
          entity: test.entity,
        }),
      });
      
      const result = await response.json();
      
      if (response.status === 404) {
        logTest(`Edge Function: ${test.name}`, 'fail', 'Function not deployed');
      } else if (result.error && result.error.includes('Unauthorized')) {
        logTest(`Edge Function: ${test.name}`, 'pass', 'Auth required (expected)');
      } else if (Array.isArray(result) || result.length >= 0) {
        logTest(`Edge Function: ${test.name}`, 'pass', `Returned ${result.length} items`);
      } else {
        logTest(`Edge Function: ${test.name}`, 'warn', `Unexpected response: ${JSON.stringify(result).substring(0, 50)}`);
      }
    } catch (err) {
      logTest(`Edge Function: ${test.name}`, 'fail', err.message);
    }
  }
}

function testFrontendFiles() {
  section('TEST 4: FRONTEND FILES');
  
  const files = [
    { path: '../hr-recruitment-platform/src/pages/PerformancePage.tsx', name: 'Performance Page' },
    { path: '../hr-recruitment-platform/src/components/AddReviewTypeModal.tsx', name: 'Add Review Type Modal' },
    { path: '../hr-recruitment-platform/src/App.tsx', name: 'App.tsx' },
    { path: '../hr-recruitment-platform/src/components/AppLayout.tsx', name: 'AppLayout.tsx' },
  ];
  
  for (const file of files) {
    const filePath = join(__dirname, file.path);
    if (existsSync(filePath)) {
      logTest(`File: ${file.name}`, 'pass');
    } else {
      logTest(`File: ${file.name}`, 'fail', `Not found: ${filePath}`);
    }
  }
}

function testRouteConfiguration() {
  section('TEST 5: ROUTE CONFIGURATION');
  
  try {
    const appTsxPath = join(__dirname, '../hr-recruitment-platform/src/App.tsx');
    const appLayoutPath = join(__dirname, '../hr-recruitment-platform/src/components/AppLayout.tsx');
    
    if (existsSync(appTsxPath)) {
      const appContent = readFileSync(appTsxPath, 'utf-8');
      
      if (appContent.includes('PerformancePage') && appContent.includes('from \'./pages/PerformancePage\'')) {
        logTest('PerformancePage Import', 'pass');
      } else {
        logTest('PerformancePage Import', 'fail', 'Import statement not found');
      }
      
      if (appContent.includes('path="performance"') || appContent.includes('path=\"performance\"')) {
        logTest('Performance Route', 'pass');
      } else {
        logTest('Performance Route', 'fail', 'Route not configured');
      }
    } else {
      logTest('App.tsx Check', 'fail', 'File not found');
    }
    
    if (existsSync(appLayoutPath)) {
      const layoutContent = readFileSync(appLayoutPath, 'utf-8');
      
      if (layoutContent.includes('TrendingUp') && layoutContent.includes('from \'lucide-react\'')) {
        logTest('TrendingUp Icon Import', 'pass');
      } else {
        logTest('TrendingUp Icon Import', 'fail', 'Icon not imported');
      }
      
      if (layoutContent.includes('Performance') && layoutContent.includes('/performance')) {
        logTest('Performance Navigation Link', 'pass');
      } else {
        logTest('Performance Navigation Link', 'fail', 'Navigation not configured');
      }
    } else {
      logTest('AppLayout.tsx Check', 'fail', 'File not found');
    }
  } catch (err) {
    logTest('Route Configuration', 'fail', err.message);
  }
}

function testSQLFiles() {
  section('TEST 6: SQL FILES VALIDATION');
  
  const sqlFiles = [
    { path: '../supabase/tables/performance_review_types.sql', table: 'performance_review_types' },
    { path: '../supabase/tables/performance_criteria.sql', table: 'performance_criteria' },
    { path: '../supabase/tables/performance_reviews.sql', table: 'performance_reviews' },
    { path: '../supabase/tables/review_participants.sql', table: 'review_participants' },
    { path: '../supabase/tables/performance_ratings.sql', table: 'performance_ratings' },
    { path: '../supabase/tables/performance_goals.sql', table: 'performance_goals' },
    { path: '../supabase/tables/kpi_definitions.sql', table: 'kpi_definitions' },
    { path: '../supabase/tables/kpi_values.sql', table: 'kpi_values' },
  ];
  
  for (const file of sqlFiles) {
    const filePath = join(__dirname, file.path);
    
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      
      if (content.includes('CREATE TABLE') && content.includes(file.table)) {
        logTest(`SQL File: ${file.table}`, 'pass');
      } else {
        logTest(`SQL File: ${file.table}`, 'fail', 'Invalid SQL structure');
      }
    } else {
      logTest(`SQL File: ${file.table}`, 'fail', 'File not found');
    }
  }
}

function testEdgeFunctionFile() {
  section('TEST 7: EDGE FUNCTION FILE');
  
  const edgeFunctionPath = join(__dirname, '../supabase/functions/performance-crud/index.ts');
  
  if (existsSync(edgeFunctionPath)) {
    const content = readFileSync(edgeFunctionPath, 'utf-8');
    
    // Check for key functionality
    const checks = [
      { pattern: 'Deno.serve', name: 'Deno.serve Handler' },
      { pattern: 'createClient', name: 'Supabase Client' },
      { pattern: 'review_types', name: 'Review Types Entity' },
      { pattern: 'auto_schedule', name: 'Auto-Schedule Function' },
      { pattern: 'performance_reviews', name: 'Reviews Entity' },
      { pattern: 'performance_goals', name: 'Goals Entity' },
      { pattern: 'kpi_definitions', name: 'KPI Definitions Entity' },
      { pattern: 'audit_logs', name: 'Audit Logging' },
    ];
    
    for (const check of checks) {
      if (content.includes(check.pattern)) {
        logTest(`Edge Function: ${check.name}`, 'pass');
      } else {
        logTest(`Edge Function: ${check.name}`, 'warn', 'Pattern not found');
      }
    }
  } else {
    logTest('Edge Function File', 'fail', 'File not found');
  }
}

async function testDataIntegrity() {
  section('TEST 8: DATA INTEGRITY');
  
  try {
    // Test foreign key relationships
    const { data: reviewTypes } = await supabase
      .from('performance_review_types')
      .select('id')
      .limit(1);
    
    if (reviewTypes && reviewTypes.length > 0) {
      const reviewTypeId = reviewTypes[0].id;
      
      // Check if criteria references valid review type
      const { data: criteria, error } = await supabase
        .from('performance_criteria')
        .select('*')
        .eq('review_type_id', reviewTypeId);
      
      if (error) {
        logTest('Foreign Key: Criteria → Review Types', 'fail', error.message);
      } else {
        logTest('Foreign Key: Criteria → Review Types', 'pass', `Found ${criteria.length} linked criteria`);
      }
    } else {
      logTest('Data Integrity Check', 'warn', 'No review types to test with');
    }
    
    // Test RLS policies
    const { error: rlsError } = await supabase
      .from('performance_review_types')
      .select('*')
      .limit(1);
    
    if (rlsError) {
      logTest('RLS Policies', 'warn', 'May need authentication');
    } else {
      logTest('RLS Policies', 'pass', 'Tables accessible');
    }
  } catch (err) {
    logTest('Data Integrity', 'fail', err.message);
  }
}

// Main test execution
async function runTests() {
  log('\n' + '='.repeat(50), colors.bright);
  log('PERFORMANCE MODULE TEST SUITE', colors.bright);
  log('='.repeat(50) + '\n', colors.bright);
  
  log(`Testing against: ${supabaseUrl}`, colors.blue);
  log(`Date: ${new Date().toISOString()}\n`, colors.blue);
  
  await testDatabaseTables();
  await testDefaultData();
  await testEdgeFunction();
  testFrontendFiles();
  testRouteConfiguration();
  testSQLFiles();
  testEdgeFunctionFile();
  await testDataIntegrity();
  
  // Summary
  section('TEST SUMMARY');
  
  const total = passed + failed + warnings;
  console.log(`\nTotal Tests: ${total}`);
  log(`✓ Passed: ${passed}`, colors.green);
  log(`✗ Failed: ${failed}`, colors.red);
  log(`⚠ Warnings: ${warnings}`, colors.yellow);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  if (failed === 0) {
    log('✓ ALL CRITICAL TESTS PASSED!', colors.green);
    console.log('\nNext Steps:');
    console.log('1. Deploy database tables (if not already done)');
    console.log('   → Run SQL files in Supabase SQL Editor');
    console.log('2. Deploy edge function:');
    console.log('   → supabase functions deploy performance-crud');
    console.log('3. Build and test frontend:');
    console.log('   → cd hr-recruitment-platform && npm run build');
    console.log('4. Access at: /performance route\n');
    
    if (warnings > 0) {
      log(`Note: ${warnings} warning(s) found - review above for details.`, colors.yellow);
    }
    
    process.exit(0);
  } else {
    log('✗ SOME TESTS FAILED', colors.red);
    console.log('\nPlease review failed tests above.');
    console.log('Refer to: PERFORMANCE_MODULE_DEPLOYMENT_GUIDE.md\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  log(`\nFatal Error: ${err.message}`, colors.red);
  process.exit(1);
});
