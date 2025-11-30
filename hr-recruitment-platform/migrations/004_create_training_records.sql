-- =====================================================================
-- Phase 2.3: Shared Training Records Table (Simplified & Robust)
-- =====================================================================

-- 1. Create Table (Basic)
CREATE TABLE IF NOT EXISTS training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Columns (using standard IF NOT EXISTS)

ALTER TABLE training_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS training_name TEXT;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS training_type TEXT;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS completion_date DATE;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Valid';
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS certificate_url TEXT;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_training_records_employee ON training_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_records_tenant ON training_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_records_expiry ON training_records(expiry_date);

-- 4. RLS
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view training records in their tenant" ON training_records;
DROP POLICY IF EXISTS "Admins can manage training records" ON training_records;

-- Create Policies
CREATE POLICY "Users can view training records in their tenant"
ON training_records FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_tenant_memberships
        WHERE user_id = auth.uid()
          AND tenant_id = training_records.tenant_id
    )
);

CREATE POLICY "Admins can manage training records"
ON training_records FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_tenant_memberships
        WHERE user_id = auth.uid()
          AND tenant_id = training_records.tenant_id
          AND role IN ('owner', 'admin', 'manager')
    )
);

-- 5. Trigger
CREATE OR REPLACE FUNCTION update_training_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expiry_date < CURRENT_DATE THEN
        NEW.status := 'Expired';
    ELSE
        NEW.status := 'Valid';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_training_status ON training_records;
CREATE TRIGGER trigger_update_training_status
    BEFORE INSERT OR UPDATE ON training_records
    FOR EACH ROW
    EXECUTE FUNCTION update_training_status();
