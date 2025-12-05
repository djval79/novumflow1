-- Check ALL tables for tenant_id column and data distribution

-- 1. Check which tables have tenant_id column
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'tenant_id'
AND table_name IN (
    'employees', 'applications', 'job_postings', 'interviews',
    'leave_requests', 'attendance_records', 'documents', 'shifts'
)
ORDER BY table_name;

-- 2. Check data distribution across tenants
SELECT 'employees' as table_name, 
    t.name as tenant_name,
    COUNT(e.id) as record_count,
    SUM(CASE WHEN e.tenant_id IS NULL THEN 1 ELSE 0 END) as null_tenant_count
FROM employees e
LEFT JOIN tenants t ON t.id = e.tenant_id
GROUP BY t.name

UNION ALL

SELECT 'applications',
    t.name,
    COUNT(a.id),
    SUM(CASE WHEN a.tenant_id IS NULL THEN 1 ELSE 0 END)
FROM applications a
LEFT JOIN tenants t ON t.id = a.tenant_id
GROUP BY t.name

UNION ALL

SELECT 'job_postings',
    t.name,
    COUNT(jp.id),
    SUM(CASE WHEN jp.tenant_id IS NULL THEN 1 ELSE 0 END)
FROM job_postings jp
LEFT JOIN tenants t ON t.id = jp.tenant_id
GROUP BY t.name

UNION ALL

SELECT 'leave_requests',
    t.name,
    COUNT(lr.id),
    SUM(CASE WHEN lr.tenant_id IS NULL THEN 1 ELSE 0 END)
FROM leave_requests lr
LEFT JOIN tenants t ON t.id = lr.tenant_id
GROUP BY t.name;

-- 3. Check RLS status for all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN ('employees', 'applications', 'job_postings', 'interviews', 'leave_requests', 'documents')
ORDER BY tablename;

-- 4. Sample employee data to see tenant_id
SELECT 
    id,
    first_name,
    last_name,
    tenant_id,
    created_at
FROM employees
ORDER BY created_at DESC
LIMIT 5;
