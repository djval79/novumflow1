-- Fix ALL NULL tenant_id values across ALL tables
-- This assigns all existing data to Ringstead tenant

DO $$
DECLARE
    ringstead_tenant_id UUID;
BEGIN
    -- Get Ringstead tenant ID
    SELECT id INTO ringstead_tenant_id
    FROM tenants
    WHERE name ILIKE '%ringstead%'
    ORDER BY created_at
    LIMIT 1;

    IF ringstead_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Ringstead tenant not found!';
    END IF;

    RAISE NOTICE 'Using Ringstead tenant ID: %', ringstead_tenant_id;

    -- Update EMPLOYEES
    UPDATE employees
    SET tenant_id = ringstead_tenant_id
    WHERE tenant_id IS NULL;
    RAISE NOTICE 'Updated % employees', (SELECT COUNT(*) FROM employees WHERE tenant_id = ringstead_tenant_id);

    -- Update JOB_POSTINGS
    UPDATE job_postings
    SET tenant_id = ringstead_tenant_id
    WHERE tenant_id IS NULL;
    RAISE NOTICE 'Updated % job_postings', (SELECT COUNT(*) FROM job_postings WHERE tenant_id = ringstead_tenant_id);

    -- Update APPLICATIONS
    UPDATE applications
    SET tenant_id = ringstead_tenant_id
    WHERE tenant_id IS NULL;
    RAISE NOTICE 'Updated % applications', (SELECT COUNT(*) FROM applications WHERE tenant_id = ringstead_tenant_id);

    -- Update INTERVIEWS
    UPDATE interviews
    SET tenant_id = ringstead_tenant_id
    WHERE tenant_id IS NULL;
    RAISE NOTICE 'Updated % interviews', (SELECT COUNT(*) FROM interviews WHERE tenant_id = ringstead_tenant_id);

    -- Update LEAVE_REQUESTS
    UPDATE leave_requests
    SET tenant_id = ringstead_tenant_id
    WHERE tenant_id IS NULL;
    RAISE NOTICE 'Updated % leave_requests', (SELECT COUNT(*) FROM leave_requests WHERE tenant_id = ringstead_tenant_id);

    -- Update ATTENDANCE_RECORDS
    UPDATE attendance_records
    SET tenant_id = ringstead_tenant_id
    WHERE tenant_id IS NULL;
    RAISE NOTICE 'Updated % attendance_records', (SELECT COUNT(*) FROM attendance_records WHERE tenant_id = ringstead_tenant_id);

    -- Update DOCUMENTS
    UPDATE documents
    SET tenant_id = ringstead_tenant_id
    WHERE tenant_id IS NULL;
    RAISE NOTICE 'Updated % documents', (SELECT COUNT(*) FROM documents WHERE tenant_id = ringstead_tenant_id);

    -- Update AUDIT_LOGS
    UPDATE audit_logs
    SET tenant_id = ringstead_tenant_id
    WHERE tenant_id IS NULL;
    RAISE NOTICE 'Updated % audit_logs', (SELECT COUNT(*) FROM audit_logs WHERE tenant_id = ringstead_tenant_id);

END $$;

-- Verification query
SELECT 
    'employees' as table_name,
    COUNT(*) as total,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as with_tenant,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as without_tenant
FROM employees
UNION ALL
SELECT 'applications', COUNT(*), COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END), COUNT(CASE WHEN tenant_id IS NULL THEN 1 END)
FROM applications
UNION ALL
SELECT 'job_postings', COUNT(*), COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END), COUNT(CASE WHEN tenant_id IS NULL THEN 1 END)
FROM job_postings
UNION ALL
SELECT 'leave_requests', COUNT(*), COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END), COUNT(CASE WHEN tenant_id IS NULL THEN 1 END)
FROM leave_requests
UNION ALL
SELECT 'documents', COUNT(*), COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END), COUNT(CASE WHEN tenant_id IS NULL THEN 1 END)
FROM documents;
