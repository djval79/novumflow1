
-- Employee Tenant Fix
-- Ensures employees table has tenant_id for multi-tenancy.

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'tenant_id') THEN
            ALTER TABLE employees ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;
