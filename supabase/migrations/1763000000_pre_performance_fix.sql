
-- Schema Hotfixes for Deployment Drift

-- 1. Ensure manager_id exists in employees (used by performance module)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'manager_id') THEN
        ALTER TABLE employees ADD COLUMN manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Ensure reporting_to also exists if anyone still uses it (optional alias)
-- ALTER TABLE employees ADD COLUMN IF NOT EXISTS reporting_to UUID REFERENCES employees(id) ON DELETE SET NULL;

-- 3. Ensure compliance_alerts has all required columns (from failed 1762967421)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'compliance_alerts') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compliance_alerts' AND column_name = 'employee_id') THEN
            ALTER TABLE compliance_alerts ADD COLUMN employee_id UUID;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'compliance_alerts' AND column_name = 'status') THEN
            ALTER TABLE compliance_alerts ADD COLUMN status VARCHAR(50);
        END IF;
    END IF;
END $$;
