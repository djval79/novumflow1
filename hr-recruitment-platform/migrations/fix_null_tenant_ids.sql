-- Fix NULL tenant_id values in recruitment tables
-- This migration assigns existing data to tenants and prevents future NULL values

-- Step 1: Get the list of tenants to see what we're working with
-- Run this first to see your tenants:
-- SELECT id, name FROM tenants ORDER BY created_at;

-- Step 2: Assign existing job_postings to the first tenant
-- IMPORTANT: Replace 'YOUR_TENANT_ID_HERE' with an actual tenant ID from Step 1
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Get the first active tenant
    SELECT id INTO default_tenant_id
    FROM tenants
    WHERE is_active = true
    ORDER BY created_at
    LIMIT 1;

    -- Update job_postings
    UPDATE job_postings
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;

    RAISE NOTICE 'Updated % job_postings with tenant_id: %', 
        (SELECT COUNT(*) FROM job_postings WHERE tenant_id = default_tenant_id),
        default_tenant_id;

    -- Update applications
    UPDATE applications
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;

    RAISE NOTICE 'Updated % applications with tenant_id: %', 
        (SELECT COUNT(*) FROM applications WHERE tenant_id = default_tenant_id),
        default_tenant_id;

    -- Update interviews
    UPDATE interviews
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;

    RAISE NOTICE 'Updated % interviews with tenant_id: %', 
        (SELECT COUNT(*) FROM interviews WHERE tenant_id = default_tenant_id),
        default_tenant_id;
END $$;

-- Step 3: Make tenant_id NOT NULL to prevent future issues
ALTER TABLE job_postings 
    ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE applications 
    ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE interviews 
    ALTER COLUMN tenant_id SET NOT NULL;

-- Step 4: Create trigger function to auto-assign tenant_id
CREATE OR REPLACE FUNCTION set_tenant_id_from_context()
RETURNS TRIGGER AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    -- Try to get tenant_id from the current user's memberships
    SELECT tenant_id INTO current_tenant_id
    FROM user_tenant_memberships
    WHERE user_id = auth.uid()
    AND is_active = true
    ORDER BY joined_at
    LIMIT 1;

    -- If no tenant found, use the first active tenant as fallback
    IF current_tenant_id IS NULL THEN
        SELECT id INTO current_tenant_id
        FROM tenants
        WHERE is_active = true
        ORDER BY created_at
        LIMIT 1;
    END IF;

    -- Set the tenant_id if not already set
    IF NEW.tenant_id IS NULL THEN
        NEW.tenant_id := current_tenant_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create triggers for auto-assignment
DROP TRIGGER IF EXISTS set_job_posting_tenant ON job_postings;
CREATE TRIGGER set_job_posting_tenant
    BEFORE INSERT ON job_postings
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_from_context();

DROP TRIGGER IF EXISTS set_application_tenant ON applications;
CREATE TRIGGER set_application_tenant
    BEFORE INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_from_context();

DROP TRIGGER IF EXISTS set_interview_tenant ON interviews;
CREATE TRIGGER set_interview_tenant
    BEFORE INSERT ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_from_context();

-- Step 6: Verify the fix
SELECT 
    'job_postings' as table_name,
    COUNT(*) as total_records,
    COUNT(tenant_id) as records_with_tenant,
    COUNT(*) - COUNT(tenant_id) as records_without_tenant
FROM job_postings
UNION ALL
SELECT 
    'applications',
    COUNT(*),
    COUNT(tenant_id),
    COUNT(*) - COUNT(tenant_id)
FROM applications
UNION ALL
SELECT 
    'interviews',
    COUNT(*),
    COUNT(tenant_id),
    COUNT(*) - COUNT(tenant_id)
FROM interviews;
