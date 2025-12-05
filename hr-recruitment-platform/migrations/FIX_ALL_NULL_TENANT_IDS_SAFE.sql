-- Fix NULL tenant_id values - SAFE VERSION
-- Only updates tables that have tenant_id column

DO $$
DECLARE
    ringstead_tenant_id UUID;
    updated_count INTEGER;
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

    -- Update EMPLOYEES (if tenant_id column exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'tenant_id'
    ) THEN
        UPDATE employees SET tenant_id = ringstead_tenant_id WHERE tenant_id IS NULL;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % employees', updated_count;
    ELSE
        RAISE NOTICE 'employees table does not have tenant_id column - skipping';
    END IF;

    -- Update JOB_POSTINGS
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_postings' AND column_name = 'tenant_id'
    ) THEN
        UPDATE job_postings SET tenant_id = ringstead_tenant_id WHERE tenant_id IS NULL;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % job_postings', updated_count;
    ELSE
        RAISE NOTICE 'job_postings table does not have tenant_id column - skipping';
    END IF;

    -- Update APPLICATIONS
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' AND column_name = 'tenant_id'
    ) THEN
        UPDATE applications SET tenant_id = ringstead_tenant_id WHERE tenant_id IS NULL;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % applications', updated_count;
    ELSE
        RAISE NOTICE 'applications table does not have tenant_id column - skipping';
    END IF;

    -- Update INTERVIEWS
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interviews' AND column_name = 'tenant_id'
    ) THEN
        UPDATE interviews SET tenant_id = ringstead_tenant_id WHERE tenant_id IS NULL;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % interviews', updated_count;
    ELSE
        RAISE NOTICE 'interviews table does not have tenant_id column - skipping';
    END IF;

    -- Update LEAVE_REQUESTS
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'tenant_id'
    ) THEN
        UPDATE leave_requests SET tenant_id = ringstead_tenant_id WHERE tenant_id IS NULL;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % leave_requests', updated_count;
    ELSE
        RAISE NOTICE 'leave_requests table does not have tenant_id column - skipping';
    END IF;

    -- Update ATTENDANCE_RECORDS
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'tenant_id'
    ) THEN
        UPDATE attendance_records SET tenant_id = ringstead_tenant_id WHERE tenant_id IS NULL;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % attendance_records', updated_count;
    ELSE
        RAISE NOTICE 'attendance_records table does not have tenant_id column - skipping';
    END IF;

    -- Update DOCUMENTS
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'tenant_id'
    ) THEN
        UPDATE documents SET tenant_id = ringstead_tenant_id WHERE tenant_id IS NULL;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % documents', updated_count;
    ELSE
        RAISE NOTICE 'documents table does not have tenant_id column - skipping';
    END IF;

    -- Update AUDIT_LOGS
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'tenant_id'
    ) THEN
        UPDATE audit_logs SET tenant_id = ringstead_tenant_id WHERE tenant_id IS NULL;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % audit_logs', updated_count;
    ELSE
        RAISE NOTICE 'audit_logs table does not have tenant_id column - skipping';
    END IF;

END $$;

-- Verification: Show which tables have tenant_id and their data status
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE information_schema.columns.table_name = t.table_name 
            AND column_name = 'tenant_id'
        ) THEN 'YES'
        ELSE 'NO'
    END as has_tenant_id_column
FROM (
    SELECT 'employees' as table_name
    UNION SELECT 'applications'
    UNION SELECT 'job_postings'
    UNION SELECT 'interviews'
    UNION SELECT 'leave_requests'
    UNION SELECT 'attendance_records'
    UNION SELECT 'documents'
    UNION SELECT 'audit_logs'
) t
ORDER BY table_name;
