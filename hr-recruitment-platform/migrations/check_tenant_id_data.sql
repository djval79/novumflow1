-- Check if tenant_id column exists and has data in recruitment tables

-- 1. Check job_postings table structure and data
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'job_postings'
AND column_name = 'tenant_id';

-- 2. Check if job_postings have tenant_id values
SELECT 
    COUNT(*) as total_jobs,
    COUNT(tenant_id) as jobs_with_tenant,
    COUNT(*) - COUNT(tenant_id) as jobs_without_tenant
FROM job_postings;

-- 3. Check applications table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'applications'
AND column_name = 'tenant_id';

-- 4. Check if applications have tenant_id values
SELECT 
    COUNT(*) as total_applications,
    COUNT(tenant_id) as applications_with_tenant,
    COUNT(*) - COUNT(tenant_id) as applications_without_tenant
FROM applications;

-- 5. Check interviews table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'interviews'
AND column_name = 'tenant_id';

-- 6. Check if interviews have tenant_id values
SELECT 
    COUNT(*) as total_interviews,
    COUNT(tenant_id) as interviews_with_tenant,
    COUNT(*) - COUNT(tenant_id) as interviews_without_tenant
FROM interviews;

-- 7. Show sample data from job_postings
SELECT 
    id,
    job_title,
    tenant_id,
    created_at
FROM job_postings
ORDER BY created_at DESC
LIMIT 5;
