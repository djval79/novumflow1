CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL, -- To help identify keys (e.g. nk_live_...)
    name TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{read:staff}',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tenant api keys" ON api_keys
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );
