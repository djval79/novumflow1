-- Diagnostic: Check tenant memberships and data assignment

-- 1. Find the Ringstead tenant
SELECT id, name, slug 
FROM tenants 
WHERE name ILIKE '%ringstead%' OR slug ILIKE '%ringstead%';

-- 2. Find the hr@ringstead user
SELECT id, email 
FROM auth.users 
WHERE email LIKE '%ringstead%';

-- 3. Check which tenants hr@ringstead belongs to
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    utm.role,
    utm.is_active
FROM user_tenant_memberships utm
JOIN tenants t ON t.id = utm.tenant_id
WHERE utm.user_id = (
    SELECT id FROM auth.users WHERE email LIKE '%ringstead%' LIMIT 1
);

-- 4. Check tenant_id distribution in job_postings
SELECT 
    t.name as tenant_name,
    COUNT(jp.id) as job_count
FROM job_postings jp
LEFT JOIN tenants t ON t.id = jp.tenant_id
GROUP BY t.name
ORDER BY job_count DESC;

-- 5. Check if job_postings have tenant_id now
SELECT 
    id,
    job_title,
    tenant_id,
    created_at
FROM job_postings
ORDER BY created_at DESC
LIMIT 10;

-- 6. Test RLS policy manually
-- This simulates what the RLS policy does
SELECT 
    jp.id,
    jp.job_title,
    jp.tenant_id,
    t.name as tenant_name,
    CASE 
        WHEN jp.tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = (SELECT id FROM auth.users WHERE email LIKE '%ringstead%' LIMIT 1)
            AND is_active = true
        ) THEN 'VISIBLE'
        ELSE 'HIDDEN'
    END as visibility_status
FROM job_postings jp
LEFT JOIN tenants t ON t.id = jp.tenant_id
ORDER BY jp.created_at DESC
LIMIT 10;
