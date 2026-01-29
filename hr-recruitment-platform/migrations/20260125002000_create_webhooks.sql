-- ============================================================================
-- CREATE WEBHOOKS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret TEXT, -- Shared secret for signature verification
    description TEXT,
    event_types TEXT[] NOT NULL, -- e.g., ['employee.*', 'application.created']
    is_active BOOLEAN DEFAULT true,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhooks for their tenant" ON webhooks
    FOR SELECT
    USING (
         tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'developer')
        )
    );

CREATE POLICY "Users can manage webhooks for their tenant" ON webhooks
    FOR ALL
    USING (
         tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'developer')
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON webhooks(tenant_id);

SELECT 'SUCCESS: Webhooks table created with RLS' as status;
