#!/usr/bin/env node

/**
 * NovumFlow Ecosystem - Automated QA Verification Script
 * Runs automated checks against the database and applications
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test results tracker
const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

function logTest(name, passed, message = '') {
    const status = passed ? '✅' : '❌';
    const result = { name, passed, message };
    results.tests.push(result);

    if (passed) {
        results.passed++;
        console.log(`${status} ${name}`);
    } else {
        results.failed++;
        console.log(`${status} ${name}`);
        if (message) console.log(`   └─ ${message}`);
    }
}

function logWarning(name, message) {
    results.warnings++;
    console.log(`⚠️  ${name}`);
    if (message) console.log(`   └─ ${message}`);
}

async function runTests() {
    console.log('\n🧪 NovumFlow Ecosystem QA Verification\n');
    console.log('━'.repeat(60));

    // Phase 1: Database Schema Verification
    console.log('\n📊 Phase 1: Database Schema\n');

    try {
        // Test 1.1: Check careflow_staff table
        const { data: staffTable, error: staffError } = await supabase
            .from('careflow_staff')
            .select('*')
            .limit(1);

        logTest(
            'careflow_staff table exists',
            !staffError,
            staffError?.message
        );

        // Test 1.2: Check careflow_compliance table
        const { data: compTable, error: compError } = await supabase
            .from('careflow_compliance')
            .select('*')
            .limit(1);

        logTest(
            'careflow_compliance table exists',
            !compError,
            compError?.message
        );

        // Test 1.3: Check role_mappings table
        const { data: roleMappings, error: roleError } = await supabase
            .from('role_mappings')
            .select('*');

        logTest(
            'role_mappings table exists',
            !roleError,
            roleError?.message
        );

        if (!roleError && roleMappings) {
            logTest(
                'role_mappings has data',
                roleMappings.length > 0,
                `Found ${roleMappings.length} role mappings`
            );
        }

        // Test 1.4: Check users_profiles table
        const { data: profiles, error: profileError } = await supabase
            .from('users_profiles')
            .select('*')
            .limit(1);

        logTest(
            'users_profiles table exists',
            !profileError,
            profileError?.message
        );

    } catch (error) {
        logTest('Database connection', false, error.message);
    }

    // Phase 2: RLS Verification
    console.log('\n🔒 Phase 2: Row Level Security\n');

    try {
        // Test 2.1: Check if RLS is enabled (this will fail if not authenticated)
        const { data: staffData, error: rlsError } = await supabase
            .from('careflow_staff')
            .select('*');

        if (rlsError && rlsError.message.includes('row-level security')) {
            logTest('RLS enabled on careflow_staff', true, 'RLS is active (requires auth)');
        } else if (!rlsError) {
            logWarning('RLS check inconclusive', 'May need authentication to verify');
        } else {
            logTest('RLS enabled on careflow_staff', false, rlsError.message);
        }

    } catch (error) {
        logWarning('RLS verification', error.message);
    }

    // Phase 3: Storage Verification
    console.log('\n📁 Phase 3: Storage Configuration\n');

    try {
        // Test 3.1: Check documents bucket
        // Use service role if available for listing buckets
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const storageClient = serviceKey ? createClient(supabaseUrl, serviceKey).storage : supabase.storage;

        const { data: buckets, error: bucketError } = await storageClient.listBuckets();

        if (!bucketError && buckets) {
            const docsBucket = buckets.find(b => b.id === 'documents');
            logTest(
                'documents bucket exists',
                !!docsBucket,
                docsBucket ? `Bucket is ${docsBucket.public ? 'public' : 'private'}` : 'Bucket not found'
            );
        } else {
            logTest('documents bucket exists', false, bucketError?.message);
        }

    } catch (error) {
        logTest('Storage check', false, error.message);
    }

    // Phase 4: Edge Functions
    console.log('\n⚡ Phase 4: Edge Functions\n');

    try {
        // Test 4.1: Check sync-to-careflow endpoint
        const syncUrl = `${supabaseUrl}/functions/v1/sync-to-careflow`;

        // Just check if endpoint exists (will return 401 without auth, which is expected)
        const response = await fetch(syncUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'health_check' })
        });

        // 401 or 400 means endpoint exists but requires auth
        const endpointExists = response.status === 401 || response.status === 400 || response.status === 200;

        logTest(
            'sync-to-careflow endpoint accessible',
            endpointExists,
            `Status: ${response.status}`
        );

    } catch (error) {
        logTest('Edge function check', false, error.message);
    }

    // Phase 5: Data Integrity
    console.log('\n🔍 Phase 5: Data Integrity\n');

    try {
        // Test 5.1: Check for orphaned records
        const { data: orphanedStaff, error: orphanError } = await supabase
            .from('careflow_staff')
            .select('id, tenant_id')
            .is('tenant_id', null);

        if (!orphanError) {
            logTest(
                'No orphaned staff records',
                !orphanedStaff || orphanedStaff.length === 0,
                orphanedStaff?.length > 0 ? `Found ${orphanedStaff.length} orphaned records` : 'All records have valid tenant_id'
            );
        }

        // Test 5.2: Check for failed syncs
        const { data: failedSyncs, error: failedError } = await supabase
            .from('failed_syncs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (!failedError) {
            if (failedSyncs && failedSyncs.length > 0) {
                logWarning(
                    'Failed syncs detected',
                    `${failedSyncs.length} recent failed syncs found`
                );
            } else {
                logTest('No recent failed syncs', true);
            }
        }

    } catch (error) {
        logWarning('Data integrity check', error.message);
    }

    // Summary
    console.log('\n' + '━'.repeat(60));
    console.log('\n📋 Test Summary\n');
    console.log(`✅ Passed:   ${results.passed}`);
    console.log(`❌ Failed:   ${results.failed}`);
    console.log(`⚠️  Warnings: ${results.warnings}`);
    console.log(`📊 Total:    ${results.tests.length}`);

    const passRate = ((results.passed / results.tests.length) * 100).toFixed(1);
    console.log(`\n📈 Pass Rate: ${passRate}%`);

    if (results.failed === 0) {
        console.log('\n🎉 All critical tests passed!\n');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed. Please review the results above.\n');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('\n❌ Fatal error running tests:', error);
    process.exit(1);
});
