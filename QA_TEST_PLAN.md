# NovumFlow Ecosystem - End-to-End QA Test Plan

## Test Environment Setup
- **NovumFlow (HR)**: http://localhost:5173
- **CareFlow (Care)**: http://localhost:5174
- **Database**: Supabase (shared instance)

---

## Phase 1: Foundation & Authentication

### Test 1.1: User Registration & Profile Creation
**Steps:**
1. Navigate to NovumFlow login page
2. Click "Sign Up"
3. Enter email: `qa-test@example.com`, password: `TestPass123!`
4. Submit registration

**Expected Results:**
- ✅ User created in `auth.users`
- ✅ Profile created in `users_profiles` table
- ✅ User redirected to onboarding/dashboard

**Verification Query:**
```sql
SELECT id, email, role FROM users_profiles WHERE email = 'qa-test@example.com';
```

---

### Test 1.2: Tenant Creation (Onboarding)
**Steps:**
1. After login, user should see onboarding screen (if no tenants)
2. Enter organization name: "QA Test Care Home"
3. Enter subdomain: "qa-test"
4. Submit

**Expected Results:**
- ✅ Tenant created in `tenants` table
- ✅ User membership created with role='owner'
- ✅ Default departments seeded (Care Services, Operations)
- ✅ Default positions seeded (Care Manager, Care Worker, Administrator)
- ✅ User redirected to dashboard

**Verification Query:**
```sql
SELECT t.name, t.subdomain, utm.role 
FROM tenants t
JOIN user_tenant_memberships utm ON t.id = utm.tenant_id
WHERE t.name = 'QA Test Care Home';
```

---

## Phase 2: NovumFlow HR Operations

### Test 2.1: Create Employee
**Steps:**
1. In NovumFlow, navigate to HR Module > Employees
2. Click "Add New"
3. Fill form:
   - First Name: "Jane"
   - Last Name: "Smith"
   - Email: "jane.smith@qatest.com"
   - Employee Number: "EMP001"
   - Department: "Care Services"
   - Position: "Care Worker"
   - Status: "active"
   - Hire Date: Today's date
4. Submit

**Expected Results:**
- ✅ Employee created in `employees` table
- ✅ Trigger `trg_employee_hired_sync` fires
- ✅ Edge Function `sync-to-careflow` is called
- ✅ Employee synced to `careflow_staff` table

**Verification Queries:**
```sql
-- Check NovumFlow employee
SELECT id, first_name, last_name, status FROM employees WHERE email = 'jane.smith@qatest.com';

-- Check CareFlow staff sync
SELECT id, full_name, email, role, status FROM careflow_staff WHERE email = 'jane.smith@qatest.com';
```

---

### Test 2.2: Upload Compliance Document
**Steps:**
1. In NovumFlow, go to employee "Jane Smith"
2. Navigate to Documents/Compliance section
3. Upload DBS certificate (use any PDF)
4. Set expiry date: 1 year from now
5. Mark as verified

**Expected Results:**
- ✅ Document uploaded to `storage.buckets.documents`
- ✅ Record created in `documents` table
- ✅ Compliance status updated

**Verification Query:**
```sql
SELECT document_name, document_type, expiry_date, is_verified 
FROM documents 
WHERE employee_id = (SELECT id FROM employees WHERE email = 'jane.smith@qatest.com');
```

---

## Phase 3: Cross-App Navigation

### Test 3.1: App Switcher (NovumFlow → CareFlow)
**Steps:**
1. While logged into NovumFlow
2. Look for "Open CareFlow" button in header/sidebar
3. Click the button

**Expected Results:**
- ✅ New tab opens with CareFlow URL
- ✅ Tenant ID passed via query parameter: `?tenant=<tenant_id>`
- ✅ User automatically logged in (shared session)
- ✅ Correct tenant context loaded

---

### Test 3.2: App Switcher (CareFlow → NovumFlow)
**Steps:**
1. While logged into CareFlow
2. Look for "Open NovumFlow" button in sidebar
3. Click the button

**Expected Results:**
- ✅ New tab opens with NovumFlow URL
- ✅ Tenant ID passed via query parameter
- ✅ User automatically logged in
- ✅ Correct tenant context loaded

---

## Phase 4: CareFlow Integration

### Test 4.1: View Synced Staff
**Steps:**
1. In CareFlow, navigate to People > Staff
2. Look for "Jane Smith"

**Expected Results:**
- ✅ Employee appears in staff list
- ✅ Correct role displayed (mapped from NovumFlow)
- ✅ Status shows "Active"
- ✅ Department and position visible

---

### Test 4.2: View Compliance Status
**Steps:**
1. Click on "Jane Smith" in CareFlow staff list
2. View compliance section

**Expected Results:**
- ✅ DBS status visible
- ✅ Expiry date shown
- ✅ Compliance indicators correct (green/amber/red)

---

### Test 4.3: Manual Sync Button
**Steps:**
1. In NovumFlow, update Jane Smith's phone number
2. In CareFlow, click "Sync Protocol" button (refresh icon)
3. Wait for sync to complete

**Expected Results:**
- ✅ Toast notification: "Sync initiated"
- ✅ Employee data refreshes
- ✅ Updated phone number visible in CareFlow

---

## Phase 5: Shared Storage & Documents

### Test 5.1: Cross-App Document Access
**Steps:**
1. In NovumFlow, note the document URL for Jane's DBS certificate
2. Switch to CareFlow
3. Navigate to Documents section
4. Search for or navigate to Jane's documents

**Expected Results:**
- ✅ Document visible in CareFlow
- ✅ Can preview/download document
- ✅ Expiry date and verification status shown
- ✅ No permission errors

**Verification:**
```sql
-- Check storage policies
SELECT * FROM storage.objects WHERE bucket_id = 'documents' LIMIT 5;
```

---

## Phase 6: Row Level Security (RLS)

### Test 6.1: Tenant Isolation
**Steps:**
1. Create second test user: `qa-test-2@example.com`
2. Create second tenant: "QA Test Care Home 2"
3. Add employee to second tenant
4. Log in as first user
5. Try to view employees

**Expected Results:**
- ✅ User 1 can ONLY see employees from Tenant 1
- ✅ User 2 can ONLY see employees from Tenant 2
- ✅ No cross-tenant data leakage
- ✅ RLS policies enforced

**Verification Script:**
```sql
-- Set context to Tenant 1
SELECT set_current_tenant('<tenant_1_id>');
SELECT * FROM careflow_staff; -- Should only show Tenant 1 staff

-- Set context to Tenant 2
SELECT set_current_tenant('<tenant_2_id>');
SELECT * FROM careflow_staff; -- Should only show Tenant 2 staff
```

---

### Test 6.2: Super Admin Access
**Steps:**
1. Update test user to super admin:
   ```sql
   UPDATE users_profiles SET is_super_admin = true WHERE email = 'qa-test@example.com';
   ```
2. Log in as super admin
3. Navigate through both apps

**Expected Results:**
- ✅ Can view data from ALL tenants
- ✅ Tenant switcher shows all organizations
- ✅ No RLS restrictions applied

---

## Phase 7: Role Mapping

### Test 7.1: Role Translation
**Steps:**
1. In NovumFlow, create employee with position "Recruiter"
2. Sync to CareFlow
3. Check role in CareFlow

**Expected Results:**
- ✅ Role mapped according to `role_mappings` table
- ✅ Correct permissions applied in CareFlow
- ✅ User can access appropriate features

**Verification Query:**
```sql
SELECT 
    cs.full_name,
    cs.role as careflow_role,
    e.position as novumflow_position,
    rm.careflow_role as mapped_role
FROM careflow_staff cs
JOIN employees e ON cs.novumflow_employee_id = e.id
LEFT JOIN role_mappings rm ON e.position = rm.novumflow_role
WHERE cs.email = 'jane.smith@qatest.com';
```

---

## Phase 8: Edge Cases & Error Handling

### Test 8.1: Duplicate Employee Sync
**Steps:**
1. Manually trigger sync for same employee twice
2. Check for duplicates

**Expected Results:**
- ✅ No duplicate records created
- ✅ Existing record updated instead
- ✅ `novumflow_employee_id` used as unique key

---

### Test 8.2: Missing Compliance Data
**Steps:**
1. Create employee without any compliance docs
2. Sync to CareFlow
3. View in CareFlow

**Expected Results:**
- ✅ Employee syncs successfully
- ✅ Compliance fields show as "Pending" or "Not Provided"
- ✅ No errors thrown

---

### Test 8.3: Network Failure Handling
**Steps:**
1. Temporarily disable Edge Function
2. Try to sync employee
3. Check `failed_syncs` table

**Expected Results:**
- ✅ Error logged in `failed_syncs`
- ✅ User notified of failure
- ✅ Retry mechanism available

**Verification Query:**
```sql
SELECT * FROM failed_syncs ORDER BY created_at DESC LIMIT 5;
```

---

## Phase 9: Performance & Optimization

### Test 9.1: Bulk Sync Performance
**Steps:**
1. Create 50 employees in NovumFlow
2. Trigger bulk sync to CareFlow
3. Monitor sync time

**Expected Results:**
- ✅ All employees sync within reasonable time (<30 seconds)
- ✅ No timeout errors
- ✅ Database queries optimized

---

### Test 9.2: Concurrent User Load
**Steps:**
1. Open 5 browser tabs
2. Log in as different users in each
3. Perform operations simultaneously

**Expected Results:**
- ✅ No race conditions
- ✅ RLS correctly enforced for each session
- ✅ No data corruption

---

## Critical Issues Checklist

### Security
- [ ] RLS enabled on all tenant-scoped tables
- [ ] Service role key not exposed in client code
- [ ] Storage policies restrict access appropriately
- [ ] No SQL injection vulnerabilities

### Data Integrity
- [ ] Foreign key constraints enforced
- [ ] Cascading deletes configured correctly
- [ ] No orphaned records
- [ ] Timestamps update correctly

### User Experience
- [ ] Loading states shown during sync
- [ ] Error messages are user-friendly
- [ ] Success confirmations displayed
- [ ] Navigation is intuitive

### Integration
- [ ] Edge functions deployed and accessible
- [ ] Webhooks/triggers firing correctly
- [ ] Cross-origin requests allowed
- [ ] Session sharing works across apps

---

## Automated Test Script

Run this in Supabase SQL Editor to verify core functionality:

```sql
-- Comprehensive System Check
DO $$
DECLARE
    v_test_results TEXT := '';
BEGIN
    -- Check 1: Tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'careflow_staff') THEN
        v_test_results := v_test_results || '✅ careflow_staff table exists\n';
    ELSE
        v_test_results := v_test_results || '❌ careflow_staff table missing\n';
    END IF;

    -- Check 2: RLS enabled
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'careflow_staff' AND rowsecurity = true
    ) THEN
        v_test_results := v_test_results || '✅ RLS enabled on careflow_staff\n';
    ELSE
        v_test_results := v_test_results || '❌ RLS not enabled on careflow_staff\n';
    END IF;

    -- Check 3: Role mappings seeded
    IF EXISTS (SELECT 1 FROM role_mappings LIMIT 1) THEN
        v_test_results := v_test_results || '✅ Role mappings configured\n';
    ELSE
        v_test_results := v_test_results || '❌ Role mappings empty\n';
    END IF;

    -- Check 4: Storage bucket exists
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') THEN
        v_test_results := v_test_results || '✅ Documents bucket exists\n';
    ELSE
        v_test_results := v_test_results || '❌ Documents bucket missing\n';
    END IF;

    -- Output results
    RAISE NOTICE '%', v_test_results;
END $$;
```

---

## Sign-Off Criteria

Before marking QA as complete, ensure:
1. ✅ All critical tests pass
2. ✅ No P0/P1 bugs identified
3. ✅ Performance meets requirements
4. ✅ Security audit completed
5. ✅ Documentation updated
6. ✅ Stakeholder demo successful

---

**QA Lead Signature:** _________________  
**Date:** _________________  
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
