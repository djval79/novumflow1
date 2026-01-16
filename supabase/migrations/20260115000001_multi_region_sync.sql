-- Migration 017: Multi-Region Sync Support
-- Adds support for per-tenant CareFlow endpoints, allowing cross-project and cross-region synchronization.

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'eu-west-1',
ADD COLUMN IF NOT EXISTS careflow_endpoint_url TEXT,
ADD COLUMN IF NOT EXISTS careflow_endpoint_key TEXT;

COMMENT ON COLUMN tenants.careflow_endpoint_url IS 'The target Supabase URL for CareFlow synchronization. If null, the local project is used.';
COMMENT ON COLUMN tenants.careflow_endpoint_key IS 'The API key (service-role) for the target CareFlow project.';

-- Create audit logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS compliance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(255) NOT NULL,
    entity VARCHAR(255) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    actor_id UUID NOT NULL, -- Can be null or system ID for system actions
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE
);

ALTER TABLE compliance_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "View audit logs" ON compliance_audit_logs
        FOR SELECT
        USING (true); -- Adjust access control as needed
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
