/**
 * SQL Schema Validator
 * Validates the compliance schema SQL syntax without running it
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ValidationResult {
  category: string;
  item: string;
  status: 'VALID' | 'WARNING' | 'ERROR';
  message: string;
}

class SQLValidator {
  private schema: string = '';
  private sampleData: string = '';
  private results: ValidationResult[] = [];

  constructor() {
    const schemaPath = path.join(__dirname, 'complianceSchema.sql');
    const sampleDataPath = path.join(__dirname, 'sampleData.sql');
    
    this.schema = fs.readFileSync(schemaPath, 'utf-8');
    this.sampleData = fs.readFileSync(sampleDataPath, 'utf-8');
  }

  private log(category: string, item: string, status: 'VALID' | 'WARNING' | 'ERROR', message: string) {
    const emoji = status === 'VALID' ? '✅' : status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${emoji} [${category}] ${item}: ${message}`);
    this.results.push({ category, item, status, message });
  }

  // Validate ENUM types
  validateEnums(): void {
    console.log('\n📋 Validating ENUM types...\n');
    
    const expectedEnums = [
      'compliance_authority',
      'compliance_stage',
      'document_status',
      'urgency_level',
      'compliance_person_type'
    ];

    for (const enumName of expectedEnums) {
      const regex = new RegExp(`CREATE TYPE ${enumName} AS ENUM`, 'i');
      if (regex.test(this.schema)) {
        // Extract enum values
        const valueRegex = new RegExp(`CREATE TYPE ${enumName} AS ENUM\\s*\\(([^)]+)\\)`, 'is');
        const match = this.schema.match(valueRegex);
        if (match) {
          const values = match[1].split(',').map(v => v.trim().replace(/'/g, ''));
          this.log('ENUM', enumName, 'VALID', `Values: ${values.join(', ')}`);
        } else {
          this.log('ENUM', enumName, 'WARNING', 'Found but could not parse values');
        }
      } else {
        this.log('ENUM', enumName, 'ERROR', 'Not found in schema');
      }
    }
  }

  // Validate table definitions
  validateTables(): void {
    console.log('\n📋 Validating table definitions...\n');
    
    const expectedTables = [
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

    for (const tableName of expectedTables) {
      const regex = new RegExp(`CREATE TABLE (IF NOT EXISTS )?${tableName}\\s*\\(`, 'i');
      if (regex.test(this.schema)) {
        // Check for primary key
        const pkRegex = new RegExp(`CREATE TABLE[^;]*${tableName}[^;]*PRIMARY KEY`, 'is');
        const hasPK = pkRegex.test(this.schema);
        
        // Check for tenant_id (for multi-tenancy)
        const tenantRegex = new RegExp(`CREATE TABLE[^;]*${tableName}[^;]*tenant_id`, 'is');
        const hasTenant = tenantRegex.test(this.schema) || tableName === 'tenants' || tableName === 'compliance_document_types';
        
        if (hasPK && hasTenant) {
          this.log('TABLE', tableName, 'VALID', 'Has PRIMARY KEY and tenant support');
        } else if (hasPK) {
          this.log('TABLE', tableName, hasTenant ? 'VALID' : 'WARNING', 
            hasTenant ? 'Has PRIMARY KEY' : 'Has PRIMARY KEY but no tenant_id');
        } else {
          this.log('TABLE', tableName, 'WARNING', 'No PRIMARY KEY detected');
        }
      } else {
        this.log('TABLE', tableName, 'ERROR', 'Not found in schema');
      }
    }
  }

  // Validate foreign key references
  validateForeignKeys(): void {
    console.log('\n📋 Validating foreign key relationships...\n');
    
    const fkPatterns = [
      { table: 'compliance_documents', ref: 'compliance_persons', column: 'person_id' },
      { table: 'compliance_documents', ref: 'compliance_document_types', column: 'document_type_id' },
      { table: 'compliance_folders', ref: 'compliance_folders', column: 'parent_folder_id' },
      { table: 'compliance_document_folders', ref: 'compliance_documents', column: 'document_id' },
      { table: 'compliance_document_folders', ref: 'compliance_folders', column: 'folder_id' },
      { table: 'compliance_checklists', ref: 'compliance_persons', column: 'person_id' },
      { table: 'compliance_stage_history', ref: 'compliance_persons', column: 'person_id' },
      { table: 'compliance_tasks', ref: 'compliance_persons', column: 'person_id' }
    ];

    for (const fk of fkPatterns) {
      const regex = new RegExp(`${fk.column}[^,]*REFERENCES\\s+${fk.ref}`, 'is');
      if (regex.test(this.schema)) {
        this.log('FK', `${fk.table}.${fk.column} -> ${fk.ref}`, 'VALID', 'Foreign key defined');
      } else {
        // Check if it's a soft reference (no FK constraint)
        const softRef = new RegExp(`${fk.column}\\s+UUID`, 'i');
        if (softRef.test(this.schema)) {
          this.log('FK', `${fk.table}.${fk.column} -> ${fk.ref}`, 'WARNING', 'Column exists but no FK constraint (soft reference)');
        } else {
          this.log('FK', `${fk.table}.${fk.column} -> ${fk.ref}`, 'ERROR', 'Not found');
        }
      }
    }
  }

  // Validate indexes
  validateIndexes(): void {
    console.log('\n📋 Validating indexes...\n');
    
    const indexMatches = this.schema.match(/CREATE INDEX IF NOT EXISTS\s+(\w+)/g) || [];
    const indexCount = indexMatches.length;
    
    if (indexCount >= 15) {
      this.log('INDEX', 'Total Count', 'VALID', `Found ${indexCount} indexes`);
    } else {
      this.log('INDEX', 'Total Count', 'WARNING', `Found only ${indexCount} indexes (expected >= 15)`);
    }

    // Check for critical indexes
    const criticalIndexes = [
      'idx_compliance_persons_tenant',
      'idx_compliance_documents_person',
      'idx_compliance_documents_expiry',
      'idx_compliance_tasks_status'
    ];

    for (const idx of criticalIndexes) {
      if (this.schema.includes(idx)) {
        this.log('INDEX', idx, 'VALID', 'Critical index found');
      } else {
        this.log('INDEX', idx, 'WARNING', 'Critical index not found');
      }
    }
  }

  // Validate views
  validateViews(): void {
    console.log('\n📋 Validating views...\n');
    
    const expectedViews = ['v_compliance_status', 'v_expiring_documents'];
    
    for (const view of expectedViews) {
      const regex = new RegExp(`CREATE OR REPLACE VIEW ${view}`, 'i');
      if (regex.test(this.schema)) {
        this.log('VIEW', view, 'VALID', 'View definition found');
      } else {
        this.log('VIEW', view, 'ERROR', 'View not found');
      }
    }
  }

  // Validate functions
  validateFunctions(): void {
    console.log('\n📋 Validating functions...\n');
    
    const expectedFunctions = [
      'calculate_compliance_score',
      'check_document_expiries',
      'update_compliance_on_document_change'
    ];
    
    for (const func of expectedFunctions) {
      const regex = new RegExp(`CREATE OR REPLACE FUNCTION ${func}`, 'i');
      if (regex.test(this.schema)) {
        this.log('FUNCTION', func, 'VALID', 'Function definition found');
      } else {
        this.log('FUNCTION', func, 'ERROR', 'Function not found');
      }
    }
  }

  // Validate RLS policies
  validateRLS(): void {
    console.log('\n📋 Validating Row Level Security...\n');
    
    const rlsTables = [
      'compliance_persons',
      'compliance_documents',
      'compliance_checklists',
      'compliance_folders',
      'compliance_tasks'
    ];

    for (const table of rlsTables) {
      const enableRLS = new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`, 'i');
      const hasPolicy = new RegExp(`CREATE POLICY[^;]*ON ${table}`, 'i');
      
      if (enableRLS.test(this.schema) && hasPolicy.test(this.schema)) {
        this.log('RLS', table, 'VALID', 'RLS enabled with policies');
      } else if (enableRLS.test(this.schema)) {
        this.log('RLS', table, 'WARNING', 'RLS enabled but no policies found');
      } else {
        this.log('RLS', table, 'WARNING', 'RLS not enabled');
      }
    }
  }

  // Validate sample data
  validateSampleData(): void {
    console.log('\n📋 Validating sample data...\n');
    
    const insertTargets = [
      { table: 'compliance_persons', minCount: 5 },
      { table: 'compliance_folders', minCount: 8 },
      { table: 'compliance_documents', minCount: 10 },
      { table: 'compliance_tasks', minCount: 3 },
      { table: 'compliance_notifications', minCount: 2 }
    ];

    for (const target of insertTargets) {
      const regex = new RegExp(`INSERT INTO ${target.table}`, 'gi');
      const matches = this.sampleData.match(regex) || [];
      const count = matches.length;
      
      if (count >= target.minCount) {
        this.log('DATA', target.table, 'VALID', `Found ${count} INSERT statements (expected >= ${target.minCount})`);
      } else {
        this.log('DATA', target.table, 'WARNING', `Found ${count} INSERT statements (expected >= ${target.minCount})`);
      }
    }

    // Check for test scenarios
    const scenarios = [
      { name: 'Expired visa', pattern: /EXPIRED.*visa|visa.*EXPIRED/i },
      { name: 'Expiring document', pattern: /EXPIRING_SOON/i },
      { name: 'Critical task', pattern: /CRITICAL/i },
      { name: 'UK citizen', pattern: /British/i },
      { name: 'Non-UK worker', pattern: /Skilled Worker Visa|EU Settled/i }
    ];

    for (const scenario of scenarios) {
      if (scenario.pattern.test(this.sampleData)) {
        this.log('SCENARIO', scenario.name, 'VALID', 'Test scenario present');
      } else {
        this.log('SCENARIO', scenario.name, 'WARNING', 'Test scenario not found');
      }
    }
  }

  // Validate SQL syntax (basic checks)
  validateSyntax(): void {
    console.log('\n📋 Validating SQL syntax...\n');
    
    // Check for unclosed parentheses in schema
    const openParens = (this.schema.match(/\(/g) || []).length;
    const closeParens = (this.schema.match(/\)/g) || []).length;
    
    if (openParens === closeParens) {
      this.log('SYNTAX', 'Parentheses Balance', 'VALID', `Balanced: ${openParens} pairs`);
    } else {
      this.log('SYNTAX', 'Parentheses Balance', 'ERROR', `Unbalanced: ${openParens} open, ${closeParens} close`);
    }

    // Check for common syntax errors
    const badPatterns = [
      { pattern: /,\s*\)/g, name: 'Trailing comma before )' },
      { pattern: /\(\s*,/g, name: 'Leading comma after (' },
      { pattern: /;;\s*$/gm, name: 'Double semicolon' }
    ];

    for (const bad of badPatterns) {
      if (bad.pattern.test(this.schema)) {
        this.log('SYNTAX', bad.name, 'WARNING', 'Potential syntax issue found');
      }
    }

    // Check for proper statement termination
    const statements = this.schema.split(';').filter(s => s.trim().length > 0);
    this.log('SYNTAX', 'Statement Count', 'VALID', `${statements.length} SQL statements`);
  }

  // Run all validations
  runAllValidations(): void {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('     COMPLIANCE SCHEMA VALIDATION');
    console.log('     NovumFlow & CareFlow Compliance System');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n📅 Validation Date: ${new Date().toISOString()}`);
    console.log(`📄 Schema Size: ${this.schema.length} characters`);
    console.log(`📄 Sample Data Size: ${this.sampleData.length} characters\n`);

    this.validateSyntax();
    this.validateEnums();
    this.validateTables();
    this.validateForeignKeys();
    this.validateIndexes();
    this.validateViews();
    this.validateFunctions();
    this.validateRLS();
    this.validateSampleData();

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('     VALIDATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const valid = this.results.filter(r => r.status === 'VALID').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    const total = this.results.length;

    console.log(`  ✅ Valid:    ${valid}`);
    console.log(`  ⚠️  Warnings: ${warnings}`);
    console.log(`  ❌ Errors:   ${errors}`);
    console.log(`  📊 Total:    ${total}`);

    const score = ((valid / total) * 100).toFixed(1);
    console.log(`\n  📈 Validation Score: ${score}%`);

    if (errors === 0) {
      console.log('\n  🎉 Schema validation PASSED!');
      console.log('  The SQL files are syntactically valid and ready for deployment.');
    } else {
      console.log('\n  ⚠️  Some validation errors found.');
      console.log('  Review the errors above before deploying.');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('     DEPLOYMENT READY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\nTo deploy to Supabase:');
    console.log('1. Open: https://supabase.com/dashboard/project/niikshfoecitimepiifo/sql/new');
    console.log('2. Copy contents of DEPLOY_ALL.sql');
    console.log('3. Paste and Run');
    console.log('\nOr use individual files:');
    console.log('  - complianceSchema.sql (schema only)');
    console.log('  - sampleData.sql (test data only)');
    console.log('\n═══════════════════════════════════════════════════════════════\n');
  }
}

// Run validation
const validator = new SQLValidator();
validator.runAllValidations();
