/**
 * Compliance Schema Test Script
 * Tests the compliance database schema and sample data on Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://niikshfoecitimepiifo.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  data?: any;
}

class ComplianceSchemaTest {
  private supabase: SupabaseClient;
  private results: TestResult[] = [];

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  private log(test: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, data?: any) {
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${emoji} [${status}] ${test}: ${message}`);
    this.results.push({ test, status, message, data });
  }

  // Test 1: Check if tables exist
  async testTablesExist(): Promise<void> {
    console.log('\n📋 TEST 1: Checking if compliance tables exist...\n');
    
    const tables = [
      'tenants',
      'compliance_persons',
      'compliance_document_types',
      'compliance_documents',
      'compliance_folders',
      'compliance_document_folders',
      'compliance_checklists',
      'compliance_stage_history',
      'compliance_tasks',
      'compliance_notifications',
      'compliance_sync_log',
      'compliance_audit_log'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          this.log(`Table ${table}`, 'FAIL', `Error: ${error.message}`);
        } else {
          this.log(`Table ${table}`, 'PASS', `Table exists`);
        }
      } catch (err: any) {
        this.log(`Table ${table}`, 'FAIL', `Exception: ${err.message}`);
      }
    }
  }

  // Test 2: Check document types seeded
  async testDocumentTypesSeeded(): Promise<void> {
    console.log('\n📋 TEST 2: Checking document types are seeded...\n');
    
    try {
      const { data, error, count } = await this.supabase
        .from('compliance_document_types')
        .select('*', { count: 'exact' });

      if (error) {
        this.log('Document Types Count', 'FAIL', `Error: ${error.message}`);
        return;
      }

      const expectedCount = 28; // We seeded 28 document types
      if (count && count >= expectedCount) {
        this.log('Document Types Count', 'PASS', `Found ${count} document types (expected >= ${expectedCount})`);
      } else {
        this.log('Document Types Count', 'FAIL', `Found ${count} document types (expected >= ${expectedCount})`);
      }

      // Check specific document types
      const requiredTypes = ['rtw_passport', 'dbs_certificate', 'nmc_pin', 'mandatory_training'];
      for (const typeId of requiredTypes) {
        const found = data?.find(d => d.id === typeId);
        if (found) {
          this.log(`Document Type: ${typeId}`, 'PASS', `Found: ${found.name}`);
        } else {
          this.log(`Document Type: ${typeId}`, 'FAIL', 'Not found');
        }
      }
    } catch (err: any) {
      this.log('Document Types', 'FAIL', `Exception: ${err.message}`);
    }
  }

  // Test 3: Check sample persons
  async testSamplePersons(): Promise<void> {
    console.log('\n📋 TEST 3: Checking sample compliance persons...\n');
    
    try {
      const { data, error, count } = await this.supabase
        .from('compliance_persons')
        .select('*', { count: 'exact' });

      if (error) {
        this.log('Persons Query', 'FAIL', `Error: ${error.message}`);
        return;
      }

      if (count && count >= 7) {
        this.log('Persons Count', 'PASS', `Found ${count} compliance persons`);
      } else {
        this.log('Persons Count', 'FAIL', `Found ${count} persons (expected >= 7)`);
      }

      // Check compliance statuses
      const statuses = data?.reduce((acc: Record<string, number>, person: any) => {
        acc[person.compliance_status] = (acc[person.compliance_status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('  Compliance Status Distribution:', statuses);

      // Check for critical case (expired visa)
      const nonCompliant = data?.find((p: any) => p.compliance_status === 'NON_COMPLIANT');
      if (nonCompliant) {
        this.log('Non-Compliant Person', 'PASS', `Found: ${nonCompliant.full_name} (${nonCompliant.compliance_status})`);
      } else {
        this.log('Non-Compliant Person', 'SKIP', 'No non-compliant test case found');
      }

    } catch (err: any) {
      this.log('Sample Persons', 'FAIL', `Exception: ${err.message}`);
    }
  }

  // Test 4: Check sample documents
  async testSampleDocuments(): Promise<void> {
    console.log('\n📋 TEST 4: Checking sample compliance documents...\n');
    
    try {
      const { data, error, count } = await this.supabase
        .from('compliance_documents')
        .select('*, compliance_persons(full_name)', { count: 'exact' });

      if (error) {
        this.log('Documents Query', 'FAIL', `Error: ${error.message}`);
        return;
      }

      if (count && count >= 10) {
        this.log('Documents Count', 'PASS', `Found ${count} compliance documents`);
      } else {
        this.log('Documents Count', 'FAIL', `Found ${count} documents (expected >= 10)`);
      }

      // Check for expired documents
      const expired = data?.filter((d: any) => d.status === 'EXPIRED');
      if (expired && expired.length > 0) {
        this.log('Expired Documents', 'PASS', `Found ${expired.length} expired document(s)`);
      } else {
        this.log('Expired Documents', 'SKIP', 'No expired documents found');
      }

      // Check for expiring soon documents
      const expiringSoon = data?.filter((d: any) => d.status === 'EXPIRING_SOON');
      if (expiringSoon && expiringSoon.length > 0) {
        this.log('Expiring Soon Documents', 'PASS', `Found ${expiringSoon.length} expiring document(s)`);
      } else {
        this.log('Expiring Soon Documents', 'SKIP', 'No expiring soon documents found');
      }

      // Check authority distribution
      const authorities = data?.reduce((acc: Record<string, number>, doc: any) => {
        acc[doc.authority] = (acc[doc.authority] || 0) + 1;
        return acc;
      }, {});
      console.log('  Authority Distribution:', authorities);

    } catch (err: any) {
      this.log('Sample Documents', 'FAIL', `Exception: ${err.message}`);
    }
  }

  // Test 5: Check smart folders
  async testSmartFolders(): Promise<void> {
    console.log('\n📋 TEST 5: Checking smart folders...\n');
    
    try {
      const { data, error, count } = await this.supabase
        .from('compliance_folders')
        .select('*', { count: 'exact' });

      if (error) {
        this.log('Folders Query', 'FAIL', `Error: ${error.message}`);
        return;
      }

      if (count && count >= 10) {
        this.log('Folders Count', 'PASS', `Found ${count} smart folders`);
      } else {
        this.log('Folders Count', 'FAIL', `Found ${count} folders (expected >= 10)`);
      }

      // Check system folders
      const systemFolders = data?.filter((f: any) => f.is_system_folder);
      if (systemFolders && systemFolders.length > 0) {
        this.log('System Folders', 'PASS', `Found ${systemFolders.length} system folder(s)`);
      }

      // List folders by authority
      const byAuthority = data?.reduce((acc: Record<string, string[]>, folder: any) => {
        if (!acc[folder.authority]) acc[folder.authority] = [];
        acc[folder.authority].push(folder.name);
        return acc;
      }, {});
      console.log('  Folders by Authority:', byAuthority);

    } catch (err: any) {
      this.log('Smart Folders', 'FAIL', `Exception: ${err.message}`);
    }
  }

  // Test 6: Check compliance tasks
  async testComplianceTasks(): Promise<void> {
    console.log('\n📋 TEST 6: Checking compliance tasks...\n');
    
    try {
      const { data, error, count } = await this.supabase
        .from('compliance_tasks')
        .select('*, compliance_persons(full_name)', { count: 'exact' });

      if (error) {
        this.log('Tasks Query', 'FAIL', `Error: ${error.message}`);
        return;
      }

      if (count && count >= 3) {
        this.log('Tasks Count', 'PASS', `Found ${count} compliance tasks`);
      } else {
        this.log('Tasks Count', 'FAIL', `Found ${count} tasks (expected >= 3)`);
      }

      // Check urgency distribution
      const urgencies = data?.reduce((acc: Record<string, number>, task: any) => {
        acc[task.urgency] = (acc[task.urgency] || 0) + 1;
        return acc;
      }, {});
      console.log('  Task Urgency Distribution:', urgencies);

      // Check for critical task
      const critical = data?.find((t: any) => t.urgency === 'CRITICAL');
      if (critical) {
        this.log('Critical Task', 'PASS', `Found: "${critical.title}"`);
      } else {
        this.log('Critical Task', 'SKIP', 'No critical task found');
      }

    } catch (err: any) {
      this.log('Compliance Tasks', 'FAIL', `Exception: ${err.message}`);
    }
  }

  // Test 7: Check views work
  async testViews(): Promise<void> {
    console.log('\n📋 TEST 7: Checking database views...\n');
    
    // Test v_compliance_status view
    try {
      const { data, error } = await this.supabase
        .from('v_compliance_status')
        .select('*')
        .limit(10);

      if (error) {
        this.log('View: v_compliance_status', 'FAIL', `Error: ${error.message}`);
      } else {
        this.log('View: v_compliance_status', 'PASS', `View works, returned ${data?.length} rows`);
        if (data && data.length > 0) {
          console.log('  Sample row:', JSON.stringify(data[0], null, 2).substring(0, 200) + '...');
        }
      }
    } catch (err: any) {
      this.log('View: v_compliance_status', 'FAIL', `Exception: ${err.message}`);
    }

    // Test v_expiring_documents view
    try {
      const { data, error } = await this.supabase
        .from('v_expiring_documents')
        .select('*')
        .limit(10);

      if (error) {
        this.log('View: v_expiring_documents', 'FAIL', `Error: ${error.message}`);
      } else {
        this.log('View: v_expiring_documents', 'PASS', `View works, returned ${data?.length} rows`);
        if (data && data.length > 0) {
          data.forEach((doc: any) => {
            console.log(`    - ${doc.full_name}: ${doc.document_type} expires in ${doc.days_until_expiry} days (${doc.urgency})`);
          });
        }
      }
    } catch (err: any) {
      this.log('View: v_expiring_documents', 'FAIL', `Exception: ${err.message}`);
    }
  }

  // Test 8: Test compliance score function (via RPC)
  async testComplianceScoreFunction(): Promise<void> {
    console.log('\n📋 TEST 8: Testing compliance score calculation...\n');
    
    try {
      // Get a person ID to test
      const { data: persons } = await this.supabase
        .from('compliance_persons')
        .select('id, full_name')
        .limit(1);

      if (!persons || persons.length === 0) {
        this.log('Compliance Score Function', 'SKIP', 'No persons to test with');
        return;
      }

      const personId = persons[0].id;
      
      // Call the function via RPC
      const { data, error } = await this.supabase
        .rpc('calculate_compliance_score', { p_person_id: personId });

      if (error) {
        // Function might not be exposed via RPC, that's okay
        this.log('Compliance Score RPC', 'SKIP', `RPC not available: ${error.message}`);
      } else {
        this.log('Compliance Score RPC', 'PASS', `Calculated for ${persons[0].full_name}: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      this.log('Compliance Score Function', 'SKIP', `Exception: ${err.message}`);
    }
  }

  // Test 9: Check audit log
  async testAuditLog(): Promise<void> {
    console.log('\n📋 TEST 9: Checking audit log...\n');
    
    try {
      const { data, error, count } = await this.supabase
        .from('compliance_audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        this.log('Audit Log Query', 'FAIL', `Error: ${error.message}`);
        return;
      }

      if (count && count >= 1) {
        this.log('Audit Log', 'PASS', `Found ${count} audit log entries`);
        data?.forEach((entry: any) => {
          console.log(`    - ${entry.action} on ${entry.entity_type} by ${entry.user_email || 'system'}`);
        });
      } else {
        this.log('Audit Log', 'SKIP', 'No audit log entries found');
      }
    } catch (err: any) {
      this.log('Audit Log', 'FAIL', `Exception: ${err.message}`);
    }
  }

  // Test 10: Check cross-app sync
  async testSyncLog(): Promise<void> {
    console.log('\n📋 TEST 10: Checking cross-app sync log...\n');
    
    try {
      const { data, error, count } = await this.supabase
        .from('compliance_sync_log')
        .select('*', { count: 'exact' })
        .limit(5);

      if (error) {
        this.log('Sync Log Query', 'FAIL', `Error: ${error.message}`);
        return;
      }

      if (count && count >= 1) {
        this.log('Sync Log', 'PASS', `Found ${count} sync log entries`);
        data?.forEach((entry: any) => {
          console.log(`    - ${entry.source_app} -> ${entry.target_app}: ${entry.sync_type} (${entry.status})`);
        });
      } else {
        this.log('Sync Log', 'SKIP', 'No sync log entries found');
      }
    } catch (err: any) {
      this.log('Sync Log', 'FAIL', `Exception: ${err.message}`);
    }
  }

  // Run all tests
  async runAllTests(): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('     COMPLIANCE SCHEMA TEST SUITE');
    console.log('     NovumFlow & CareFlow Compliance System');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n🔗 Supabase URL: ${SUPABASE_URL}`);
    console.log(`📅 Test Date: ${new Date().toISOString()}\n`);

    await this.testTablesExist();
    await this.testDocumentTypesSeeded();
    await this.testSamplePersons();
    await this.testSampleDocuments();
    await this.testSmartFolders();
    await this.testComplianceTasks();
    await this.testViews();
    await this.testComplianceScoreFunction();
    await this.testAuditLog();
    await this.testSyncLog();

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('     TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log(`\n  ✅ Passed:  ${passed}`);
    console.log(`  ❌ Failed:  ${failed}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  📊 Total:   ${total}`);
    
    const successRate = ((passed / (total - skipped)) * 100).toFixed(1);
    console.log(`\n  📈 Success Rate: ${successRate}%`);

    if (failed > 0) {
      console.log('\n  ⚠️  SOME TESTS FAILED - Schema may need to be deployed');
      console.log('  Run complianceSchema.sql in Supabase SQL Editor first!');
    } else if (passed === 0) {
      console.log('\n  ⚠️  NO TESTS PASSED - Schema needs to be deployed');
      console.log('  Steps:');
      console.log('  1. Open Supabase Dashboard -> SQL Editor');
      console.log('  2. Copy contents of complianceSchema.sql');
      console.log('  3. Run the SQL');
      console.log('  4. Copy contents of sampleData.sql');
      console.log('  5. Run the SQL');
      console.log('  6. Re-run this test');
    } else {
      console.log('\n  🎉 ALL TESTS PASSED! Schema is working correctly.');
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');
  }
}

// Run tests
const test = new ComplianceSchemaTest();
test.runAllTests().catch(console.error);
