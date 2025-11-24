-- Quick fix: Enable all features for your tenant
-- Run this in Supabase SQL Editor

-- First, let's see what tenant you're assigned to
SELECT id, name, slug FROM tenants WHERE slug = 'ringstead-care';

-- Enable ALL features for Ringstead Care tenant
INSERT INTO tenant_features (tenant_id, feature_id, is_enabled, enabled_by, enabled_at)
SELECT 
    (SELECT id FROM tenants WHERE slug = 'ringstead-care'),
    f.id,
    true,
    (SELECT id FROM auth.users WHERE email = 'mrsonirie@gmail.com' OR email = 'hr@ringsteadcare.com' LIMIT 1),
    NOW()
FROM features f
ON CONFLICT (tenant_id, feature_id) 
DO UPDATE SET is_enabled = true, enabled_at = NOW();

-- Verify features are enabled
SELECT COUNT(*) as enabled_features 
FROM tenant_features tf
JOIN tenants t ON t.id = tf.tenant_id
WHERE t.slug = 'ringstead-care' AND tf.is_enabled = true;
