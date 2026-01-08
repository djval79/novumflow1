-- CareFlow Integration Tables
-- Creates tables required for NovumFlow HR -> CareFlow AI sync

-- 1. CareFlow Staff (Shadow table of NovumFlow Employees)
CREATE TABLE IF NOT EXISTS careflow_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    novumflow_employee_id UUID, -- Link to source
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    status TEXT,
    department TEXT,
    start_date DATE,
    
    -- Compliance Cache (Synced from NovumFlow)
    rtw_status TEXT,
    rtw_expiry DATE,
    rtw_verification_method TEXT,
    dbs_status TEXT,
    dbs_expiry DATE,
    compliance_blocked BOOLEAN DEFAULT false,
    compliance_issues TEXT[], -- Array of strings
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CareFlow Compliance (Shadow table of NovumFlow Compliance Docs)
CREATE TABLE IF NOT EXISTS careflow_compliance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES careflow_staff(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    document_url TEXT,
    document_type TEXT,
    verification_method TEXT,
    share_code_verified BOOLEAN,
    requires_followup BOOLEAN,
    verified_by UUID, -- REFERENCES auth.users(id) ?
    
    novumflow_record_id UUID, -- Link to source record
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_careflow_staff_tenant ON careflow_staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_careflow_staff_novum ON careflow_staff(novumflow_employee_id);
CREATE INDEX IF NOT EXISTS idx_careflow_comp_staff ON careflow_compliance(staff_id);
CREATE INDEX IF NOT EXISTS idx_careflow_comp_novum ON careflow_compliance(novumflow_record_id);

-- RLS
ALTER TABLE careflow_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_compliance ENABLE ROW LEVEL SECURITY;

-- Helper function user_has_tenant_access MUST exist in public schema from previous migrations

DROP POLICY IF EXISTS "Users can view staff in their tenant" ON careflow_staff;
CREATE POLICY "Users can view staff in their tenant" ON careflow_staff
    FOR SELECT USING (user_has_tenant_access(tenant_id));

DROP POLICY IF EXISTS "Users can view compliance in their tenant" ON careflow_compliance;
CREATE POLICY "Users can view compliance in their tenant" ON careflow_compliance
    FOR SELECT USING (user_has_tenant_access(tenant_id));
    
-- Update Trigger
DROP TRIGGER IF EXISTS update_careflow_staff_updated_at ON careflow_staff;
CREATE TRIGGER update_careflow_staff_updated_at BEFORE UPDATE ON careflow_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_careflow_compliance_updated_at ON careflow_compliance;
CREATE TRIGGER update_careflow_compliance_updated_at BEFORE UPDATE ON careflow_compliance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
