-- ============================================================================
-- CREATE API KEYS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL, -- First 8 chars for display
    key_hash TEXT NOT NULL, -- Hashed full key
    permissions JSONB DEFAULT '[]'::jsonb, -- e.g., ["read:employees", "write:webhooks"]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view API keys for their tenant" ON api_keys
    FOR SELECT
    USING (
         tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'developer')
        )
    );

CREATE POLICY "Users can manage API keys for their tenant" ON api_keys
    FOR ALL
    USING (
         tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'developer')
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

SELECT 'SUCCESS: API Keys table created with RLS' as status;
