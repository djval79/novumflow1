
CREATE TABLE IF NOT EXISTS careflow_form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE careflow_form_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Tenant isolation" ON careflow_form_templates
        FOR ALL USING (
            tenant_id IN (
                SELECT tenant_id FROM user_tenant_memberships 
                WHERE user_id = auth.uid() AND is_active = true
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
