# 🧪 NovumFlow Ecosystem - Live QA Testing Session
**Date:** 2026-01-06  
**Tester:** QA Team  
**Applications:** NovumFlow (localhost:5173) + CareFlow (localhost:5174)

---

## ✅ Pre-Test Verification

### System Status
- [x] NovumFlow running on http://localhost:5173
- [x] CareFlow running on http://localhost:5174
- [x] Database tables verified (careflow_staff, careflow_compliance, users_profiles)
- [x] Edge functions accessible
- [ ] Role mappings seeded (PENDING - manual verification needed)
- [ ] Documents bucket created (PENDING - manual verification needed)

---

## 📝 Test Execution Log

### PHASE 1: Foundation & Authentication

#### Test 1.1: User Registration
**Objective:** Create a new test user account

**Steps:**
1. Navigate to NovumFlow login page (http://localhost:5173/login)
2. Click "Manifest" or "Sign Up" button
3. Enter test credentials:
   - Email: `qa-test-$(date +%s)@example.com` (use timestamp for uniqueness)
   - Password: `TestPass123!`
4. Submit registration

**Expected Results:**
- [ ] User created successfully
- [ ] Redirected to onboarding or dashboard
- [ ] No error messages

**Actual Results:**
_[To be filled during testing]_

**Status:** ⏳ PENDING

---

#### Test 1.2: Tenant Creation (Onboarding)
**Objective:** Create organization/tenant

**Steps:**
1. After login, should see onboarding screen
2. Enter organization details:
   - Name: "QA Test Care Home"
   - Subdomain: "qa-test-$(random)"
3. Submit

**Expected Results:**
- [ ] Tenant created in database
- [ ] User assigned as owner
- [ ] Default departments created (Care Services, Operations)
- [ ] Default positions created
- [ ] Redirected to dashboard

**Verification Query:**
```sql
SELECT t.name, t.subdomain, utm.role 
FROM tenants t
JOIN user_tenant_memberships utm ON t.id = utm.tenant_id
WHERE t.name = 'QA Test Care Home';
```

**Actual Results:**
_[To be filled during testing]_

**Status:** ⏳ PENDING

---

### PHASE 2: NovumFlow HR Operations

#### Test 2.1: Create Employee
**Objective:** Add a new employee in NovumFlow

**Steps:**
1. In NovumFlow, navigate to "HR Module" or "Employees"
2. Click "Add New" or "Add Employee"
3. Fill form with test data:
   - First Name: "Jane"
   - Last Name: "Smith"
   - Email: "jane.smith@qatest.com"
   - Employee Number: "EMP001"
   - Department: "Care Services"
   - Position: "Care Worker"
   - Status: "active"
   - Hire Date: [Today's date]
4. Submit

**Expected Results:**
- [ ] Employee created in `employees` table
- [ ] Success notification shown
- [ ] Employee appears in list
- [ ] Auto-sync trigger fires (check logs)

**Verification Query:**
```sql
-- Check employee in NovumFlow
SELECT id, first_name, last_name, status, position 
FROM employees 
WHERE email = 'jane.smith@qatest.com';

-- Check sync to CareFlow (may take a few seconds)
SELECT id, full_name, email, role, status 
FROM careflow_staff 
WHERE email = 'jane.smith@qatest.com';
```

**Actual Results:**
_[To be filled during testing]_

**Status:** ⏳ PENDING

---

#### Test 2.2: Upload Compliance Document
**Objective:** Upload a DBS certificate for the employee

**Steps:**
1. In NovumFlow, find employee "Jane Smith"
2. Navigate to Documents or Compliance section
3. Click "Upload Document"
4. Select document type: "DBS Certificate"
5. Upload a test PDF file
6. Set expiry date: 1 year from now
7. Mark as verified
8. Submit

**Expected Results:**
- [ ] Document uploaded to storage
- [ ] Record created in `documents` table
- [ ] Document visible in employee profile
- [ ] Expiry date tracked

**Verification Query:**
```sql
SELECT document_name, document_type, expiry_date, is_verified 
FROM documents 
WHERE employee_id = (SELECT id FROM employees WHERE email = 'jane.smith@qatest.com');
```

**Actual Results:**
_[To be filled during testing]_

**Status:** ⏳ PENDING

---

### PHASE 3: Cross-App Navigation

#### Test 3.1: App Switcher (NovumFlow → CareFlow)
**Objective:** Navigate from NovumFlow to CareFlow using the app switcher

**Steps:**
1. While logged into NovumFlow
2. Look for "Open CareFlow" button (should be in header or sidebar)
3. Click the button

**Expected Results:**
- [ ] New tab/window opens
- [ ] CareFlow loads at http://localhost:5174
- [ ] Tenant ID in URL: `?tenant=<tenant_id>`
- [ ] User automatically authenticated
- [ ] Correct tenant context loaded

**Actual Results:**
_[To be filled during testing]_

**Status:** ⏳ PENDING

---

#### Test 3.2: App Switcher (CareFlow → NovumFlow)
**Objective:** Navigate from CareFlow back to NovumFlow

**Steps:**
1. While in CareFlow
2. Look for "Open NovumFlow" button in sidebar
3. Click the button

**Expected Results:**
- [ ] New tab opens with NovumFlow
- [ ] User authenticated
- [ ] Tenant context preserved

**Actual Results:**
_[To be filled during testing]_

**Status:** ⏳ PENDING

---

### PHASE 4: CareFlow Integration

#### Test 4.1: View Synced Staff
**Objective:** Verify employee appears in CareFlow

**Steps:**
1. In CareFlow, navigate to "People" > "Staff"
2. Look for "Jane Smith" in the list

**Expected Results:**
- [ ] Employee visible in staff list
- [ ] Correct name displayed
- [ ] Role properly mapped (Care Worker → Carer)
- [ ] Status shows "Active"
- [ ] Department visible

**Actual Results:**
_[To be filled during testing]_

**Status:** ⏳ PENDING

---

#### Test 4.2: Manual Sync Button
**Objective:** Test manual sync functionality

**Steps:**
1. In NovumFlow, update Jane Smith's phone number to "555-0123"
2. Switch to CareFlow
3. Find the "Sync Protocol" or refresh button
4. Click to trigger manual sync
5. Wait for completion

**Expected Results:**
- [ ] Toast notification: "Sync initiated"
- [ ] Loading indicator shown
- [ ] Data refreshes
- [ ] Updated phone number visible

**Actual Results:**
_[To be filled during testing]_

**Status:** ⏳ PENDING

---

### PHASE 5: Row Level Security (RLS)

#### Test 5.1: Tenant Isolation
**Objective:** Verify users can only see their own tenant's data

**Steps:**
1. Create second test user: `qa-test-2@example.com`
2. Create second tenant: "QA Test Care Home 2"
3. Add employee to second tenant
4. Log out and log back in as first user
5. Try to view employees

**Expected Results:**
- [ ] User 1 sees ONLY Tenant 1 employees
- [ ] User 2 sees ONLY Tenant 2 employees
- [ ] No cross-tenant data visible
- [ ] RLS enforced correctly

**Verification Query:**
```sql
-- As User 1 (set tenant context)
SELECT set_current_tenant('<tenant_1_id>');
SELECT COUNT(*) FROM careflow_staff; -- Should match Tenant 1 count

-- As User 2
SELECT set_current_tenant('<tenant_2_id>');
SELECT COUNT(*) FROM careflow_staff; -- Should match Tenant 2 count
```

**Actual Results:**
_[To be filled during testing]_

**Status:** ⏳ PENDING

---

## 🐛 Issues Found

### Issue #1
**Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low  
**Component:**  
**Description:**  
**Steps to Reproduce:**  
**Expected:**  
**Actual:**  
**Workaround:**  
**Status:**  

---

## 📊 Test Summary

**Total Tests:** 9  
**Passed:** 0  
**Failed:** 0  
**Blocked:** 0  
**Pending:** 9  

**Pass Rate:** 0%  

---

## 🎯 Sign-Off

**QA Lead:** ___________________  
**Date:** ___________________  
**Overall Status:** [ ] PASS [ ] FAIL [ ] BLOCKED  

**Notes:**
_[Add any additional observations or recommendations]_
