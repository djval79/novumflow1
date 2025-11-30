-- ============================================
-- Phase 2: Enhance Employees Table for Integration & Compliance
-- ============================================

-- 1. Ensure Employees Table Exists
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- Optional link to login user
    
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL, -- Carer, Senior Carer, Nurse, Manager
    
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended', 'On Leave')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Integration Fields (Safe Alter)
DO $$
BEGIN
    -- Link to NovumFlow
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'novumflow_employee_id') THEN
        ALTER TABLE employees ADD COLUMN novumflow_employee_id UUID;
    END IF;

    -- Home Office Compliance (Right to Work)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'right_to_work_status') THEN
        ALTER TABLE employees ADD COLUMN right_to_work_status TEXT DEFAULT 'Pending' CHECK (right_to_work_status IN ('Valid', 'Expired', 'Missing', 'Pending'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'right_to_work_expiry') THEN
        ALTER TABLE employees ADD COLUMN right_to_work_expiry DATE;
    END IF;

    -- CQC Compliance (DBS)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'dbs_status') THEN
        ALTER TABLE employees ADD COLUMN dbs_status TEXT DEFAULT 'Pending' CHECK (dbs_status IN ('Clear', 'Pending', 'Flagged', 'Expired'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'dbs_expiry') THEN
        ALTER TABLE employees ADD COLUMN dbs_expiry DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'dbs_number') THEN
        ALTER TABLE employees ADD COLUMN dbs_number TEXT;
    END IF;

    -- General Compliance Data (JSONB for flexibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'compliance_data') THEN
        ALTER TABLE employees ADD COLUMN compliance_data JSONB DEFAULT '{}'; 
        -- Structure: { training: [{name: 'Manual Handling', expiry: '2025-01-01'}], documents: [...] }
    END IF;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_novumflow_id ON employees(novumflow_employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_rtw_status ON employees(right_to_work_status);
CREATE INDEX IF NOT EXISTS idx_employees_dbs_status ON employees(dbs_status);

-- 4. RLS Policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can access employees in their tenant" ON employees;

-- Create Policy (using the safe function from Phase 1)
CREATE POLICY "Users can access employees in their tenant"
ON employees FOR ALL USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer']));

-- 5. Updated At Trigger
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
