-- Create onboarding records for all existing tenants that don't have one
-- Run this in Supabase SQL Editor if the automatic creation didn't work

INSERT INTO tenant_onboarding (tenant_id, started_at)
SELECT id, NOW()
FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM tenant_onboarding)
ON CONFLICT (tenant_id) DO NOTHING;

-- Verify the records were created
SELECT 
    t.id,
    t.name,
    CASE 
        WHEN onb.id IS NOT NULL THEN 'Has onboarding record'
        ELSE 'Missing onboarding record'
    END as status
FROM tenants t
LEFT JOIN tenant_onboarding onb ON t.id = onb.tenant_id
ORDER BY t.name;
