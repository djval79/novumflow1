
-- Training Records Bootstrap
-- Required for CareFlow sync and other compliance modules.

CREATE TABLE IF NOT EXISTS training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    training_name TEXT,
    training_type TEXT,
    provider TEXT,
    completion_date DATE,
    expiry_date DATE,
    status TEXT DEFAULT 'Valid',
    certificate_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_records_employee ON training_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_records_tenant ON training_records(tenant_id);

-- RLS
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_view_tenant' AND tablename = 'training_records') THEN
        CREATE POLICY "authenticated_view_tenant" ON training_records 
        FOR ALL TO authenticated USING (public.user_has_tenant_access(tenant_id));
    END IF;
END $$;
