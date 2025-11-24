-- Seed API keys for tenants (placeholder values)
-- Run after create_tenant_api_keys.sql

INSERT INTO tenant_api_keys (tenant_id, service_name, api_key)
SELECT t.id, 'email_service', 
  CASE t.slug
    WHEN 'ringstead-care' THEN 'ringstead-email-api-key-123'
    WHEN 'welcome-care' THEN 'welcome-email-api-key-456'
    WHEN 'sunrise-care' THEN 'sunrise-email-api-key-789'
    WHEN 'harmony-health' THEN 'harmony-email-api-key-012'
    WHEN 'caring-hands' THEN 'caring-email-api-key-345'
  END
FROM tenants t
WHERE t.slug IN ('ringstead-care', 'welcome-care', 'sunrise-care', 'harmony-health', 'caring-hands')
ON CONFLICT (tenant_id, service_name) DO NOTHING;
