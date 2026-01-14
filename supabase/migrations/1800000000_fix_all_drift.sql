
-- Consolidated Schema Drift Fixes
-- This migration sorts after 176... and before 2025... 

-- 1. Fix users_profiles (Drift found in tenants_rls)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profiles' AND column_name = 'is_super_admin') THEN
            ALTER TABLE users_profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profiles' AND column_name = 'tenant_id') THEN
            ALTER TABLE users_profiles ADD COLUMN tenant_id UUID;
        END IF;
    END IF;
END $$;

-- 2. Fix employees (Drift found in performance_reviews)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'manager_id') THEN
            ALTER TABLE employees ADD COLUMN manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- 3. Fix compliance_alerts (Drift found in add_home_office_compliance_tables_part2)
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

-- 4. Ensure user_tenant_memberships exists (Drift found in careflow_notifications)
CREATE TABLE IF NOT EXISTS user_tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References auth.users but we keep it loose for migrations
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);
