-- =====================================================================
-- Phase 2: Unify Employees Table for NovumFlow & CareFlow Integration
-- =====================================================================

DO $$
BEGIN
    -- 1. Ensure table exists (if not already)
    CREATE TABLE IF NOT EXISTS employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. Add NovumFlow columns (if missing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'first_name') THEN
        ALTER TABLE employees ADD COLUMN first_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'last_name') THEN
        ALTER TABLE employees ADD COLUMN last_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'email') THEN
        ALTER TABLE employees ADD COLUMN email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'phone') THEN
        ALTER TABLE employees ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'department') THEN
        ALTER TABLE employees ADD COLUMN department TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'position') THEN
        ALTER TABLE employees ADD COLUMN position TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'status') THEN
        ALTER TABLE employees ADD COLUMN status TEXT DEFAULT 'Active';
    END IF;

    -- 3. Add CareFlow columns (if missing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'name') THEN
        ALTER TABLE employees ADD COLUMN name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'role') THEN
        ALTER TABLE employees ADD COLUMN role TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'novumflow_employee_id') THEN
        ALTER TABLE employees ADD COLUMN novumflow_employee_id UUID;
    END IF;
    
    -- 4. Add tenant_id if missing (Critical for Multi-Tenancy)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'tenant_id') THEN
        ALTER TABLE employees ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);
    END IF;

END $$;

-- 5. Create Trigger to Sync Name Fields
-- When first_name/last_name changes -> update name
-- When name changes -> try to split into first_name/last_name (optional, but good for CareFlow edits)

CREATE OR REPLACE FUNCTION sync_employee_names()
RETURNS TRIGGER AS $$
BEGIN
    -- If first_name or last_name is updated, update full name
    IF (TG_OP = 'INSERT' OR NEW.first_name IS DISTINCT FROM OLD.first_name OR NEW.last_name IS DISTINCT FROM OLD.last_name) THEN
        IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
            NEW.name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
        END IF;
    END IF;

    -- If name is updated (from CareFlow), try to update first/last if they are null
    -- (Simple logic: split by first space)
    IF (TG_OP = 'INSERT' OR NEW.name IS DISTINCT FROM OLD.name) AND (NEW.first_name IS NULL AND NEW.last_name IS NULL) THEN
        IF NEW.name IS NOT NULL THEN
            NEW.first_name := split_part(NEW.name, ' ', 1);
            NEW.last_name := substring(NEW.name from position(' ' in NEW.name) + 1);
            IF NEW.last_name = '' THEN NEW.last_name := NULL; END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_employee_names ON employees;
CREATE TRIGGER trigger_sync_employee_names
    BEFORE INSERT OR UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION sync_employee_names();

-- 6. Backfill 'name' for existing records
UPDATE employees 
SET name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE name IS NULL AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- 7. Backfill 'first_name'/'last_name' for existing records
UPDATE employees
SET 
    first_name = split_part(name, ' ', 1),
    last_name = NULLIF(substring(name from position(' ' in name) + 1), '')
WHERE (first_name IS NULL OR last_name IS NULL) AND name IS NOT NULL;
