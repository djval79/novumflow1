-- Migration 017: Multi-Region Sync Support
-- Adds support for per-tenant CareFlow endpoints, allowing cross-project and cross-region synchronization.

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'eu-west-1',
ADD COLUMN IF NOT EXISTS careflow_endpoint_url TEXT,
ADD COLUMN IF NOT EXISTS careflow_endpoint_key TEXT;

COMMENT ON COLUMN tenants.careflow_endpoint_url IS 'The target Supabase URL for CareFlow synchronization. If null, the local project is used.';
COMMENT ON COLUMN tenants.careflow_endpoint_key IS 'The API key (service-role) for the target CareFlow project.';

-- Update audit logs to track sync region changes
INSERT INTO compliance_audit_logs (
    action,
    entity,
    entity_id,
    actor_id,
    ip_address,
    metadata
) VALUES (
    'SYSTEM_UPGRADE',
    'Schema',
    'Migration_017',
    '00000000-0000-0000-0000-000000000000',
    '127.0.0.1',
    '{"description": "Multi-region sync support enabled via Migration 017"}'
);
