
-- Compliance Bootstrap
-- Required for CQC compliance module and CareFlow sync.

-- 1. DBS Checks
CREATE TABLE IF NOT EXISTS dbs_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    check_type TEXT NOT NULL DEFAULT 'enhanced',
    issue_date DATE,
    expiry_date DATE,
    status TEXT DEFAULT 'pending',
    certificate_number TEXT,
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE dbs_checks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 2. Employment References
CREATE TABLE IF NOT EXISTS employment_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    referee_name TEXT NOT NULL,
    referee_email TEXT,
    status TEXT DEFAULT 'pending',
    received_date DATE,
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE employment_references ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 3. Right to Work
CREATE TABLE IF NOT EXISTS right_to_work_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    document_type TEXT,
    document_number TEXT,
    expiry_date DATE,
    check_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'verified',
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE right_to_work_checks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 4. Staff Compliance Status
CREATE TABLE IF NOT EXISTS staff_compliance_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    dbs_status TEXT DEFAULT 'missing',
    references_status TEXT DEFAULT 'missing',
    training_status TEXT DEFAULT 'missing',
    rtw_status TEXT DEFAULT 'missing',
    overall_score INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, employee_id)
);
ALTER TABLE staff_compliance_status ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- RLS
ALTER TABLE dbs_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE right_to_work_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_compliance_status ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all' AND tablename = 'dbs_checks') THEN
        CREATE POLICY "authenticated_all" ON dbs_checks FOR ALL TO authenticated USING (public.user_has_tenant_access(tenant_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all' AND tablename = 'employment_references') THEN
        CREATE POLICY "authenticated_all" ON employment_references FOR ALL TO authenticated USING (public.user_has_tenant_access(tenant_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all' AND tablename = 'right_to_work_checks') THEN
        CREATE POLICY "authenticated_all" ON right_to_work_checks FOR ALL TO authenticated USING (public.user_has_tenant_access(tenant_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all' AND tablename = 'staff_compliance_status') THEN
        CREATE POLICY "authenticated_all" ON staff_compliance_status FOR ALL TO authenticated USING (public.user_has_tenant_access(tenant_id));
    END IF;
END $$;
