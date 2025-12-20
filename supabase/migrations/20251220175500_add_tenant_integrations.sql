-- Create tenant_integrations table for storing third-party integration settings per tenant
CREATE TABLE IF NOT EXISTS tenant_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    is_connected BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}',
    credentials_encrypted TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_service UNIQUE (tenant_id, service_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_integrations_tenant ON tenant_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_integrations_service ON tenant_integrations(service_name);

-- Enable RLS
ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their tenant integrations" ON tenant_integrations
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage their tenant integrations" ON tenant_integrations
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true 
            AND role IN ('owner', 'admin')
        )
    );

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_integrations TO service_role;
