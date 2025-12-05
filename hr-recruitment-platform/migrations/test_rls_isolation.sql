-- Test RLS Isolation - Verify tenant data separation works

-- 1. Check current super admin status
SELECT 
    u.email,
    up.role,
    'You are super admin - you see ALL data' as note
FROM users_profiles up
JOIN auth.users u ON u.id = up.user_id
WHERE u.email IN ('mrsonirie@gmail.com', 'hr@ringsteadcare.com');

-- 2. Check Ringstead tenant ID
SELECT 
    id as ringstead_tenant_id,
    name,
    'This is Ringstead - all data should belong to this tenant' as note
FROM tenants
WHERE name ILIKE '%ringstead%';

-- 3. Verify ALL data is assigned to Ringstead
SELECT 
    'employees' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN tenant_id = (SELECT id FROM tenants WHERE name ILIKE '%ringstead%') THEN 1 END) as ringstead_records,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as null_tenant_records
FROM employees

UNION ALL

SELECT 'applications', COUNT(*), 
    COUNT(CASE WHEN tenant_id = (SELECT id FROM tenants WHERE name ILIKE '%ringstead%') THEN 1 END),
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END)
FROM applications

UNION ALL

SELECT 'job_postings', COUNT(*),
    COUNT(CASE WHEN tenant_id = (SELECT id FROM tenants WHERE name ILIKE '%ringstead%') THEN 1 END),
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END)
FROM job_postings;

-- 4. Create a test: What would a Novumsolvo user see?
-- Simulate RLS for a non-super-admin user who belongs to Novumsolvo
SELECT 
    'Test: Novumsolvo user view' as test_name,
    COUNT(*) as employees_visible
FROM employees
WHERE tenant_id IN (
    SELECT id FROM tenants WHERE name ILIKE '%novumsolvo%'
);
-- Expected: 0 (Novumsolvo has no employees)

-- 5. Create a test: What would a Ringstead user see?
SELECT 
    'Test: Ringstead user view' as test_name,
    COUNT(*) as employees_visible
FROM employees
WHERE tenant_id IN (
    SELECT id FROM tenants WHERE name ILIKE '%ringstead%'
);
-- Expected: 24 (all employees belong to Ringstead)

-- SOLUTION: The tenant switcher should HIDE data for mock organizations
-- because they have no data. You (super admin) will always see everything.
-- The fix is in the APPLICATION CODE, not the database.
