-- Quick diagnostic: Check if data was actually assigned to Ringstead tenant

-- 1. Find Ringstead tenant ID
SELECT id, name FROM tenants WHERE name ILIKE '%ringstead%';

-- 2. Check employees assigned to Ringstead
SELECT COUNT(*) as ringstead_employees
FROM employees
WHERE tenant_id = (SELECT id FROM tenants WHERE name ILIKE '%ringstead%' LIMIT 1);

-- 3. Check applications assigned to Ringstead  
SELECT COUNT(*) as ringstead_applications
FROM applications
WHERE tenant_id = (SELECT id FROM tenants WHERE name ILIKE '%ringstead%' LIMIT 1);

-- 4. Check job_postings assigned to Ringstead
SELECT COUNT(*) as ringstead_jobs
FROM job_postings
WHERE tenant_id = (SELECT id FROM tenants WHERE name ILIKE '%ringstead%' LIMIT 1);

-- 5. Sample employee data to verify tenant_id
SELECT id, first_name, last_name, tenant_id
FROM employees
ORDER BY created_at DESC
LIMIT 5;
