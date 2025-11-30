-- ============================================
-- Phase 1: Multi-Tenant Database Schema
-- Step 2: Add tenant_id to Existing Tables (SAFE VERSION)
-- ============================================

-- ============================================
-- Add tenant_id to Core Tables
-- ============================================

-- users_profiles
ALTER TABLE users_profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_users_profiles_tenant ON users_profiles(tenant_id);

-- employees
ALTER TABLE IF EXISTS employees
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);

-- job_postings
ALTER TABLE IF EXISTS job_postings
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_job_postings_tenant ON job_postings(tenant_id);

-- applications
ALTER TABLE IF EXISTS applications
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_applications_tenant ON applications(tenant_id);

-- interviews
ALTER TABLE IF EXISTS interviews
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_interviews_tenant ON interviews(tenant_id);

-- documents
ALTER TABLE IF EXISTS documents
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);

-- training_records
ALTER TABLE IF EXISTS training_records
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_training_records_tenant ON training_records(tenant_id);

-- performance_reviews
ALTER TABLE IF EXISTS reviews
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_reviews_tenant ON reviews(tenant_id);

-- goals
ALTER TABLE IF EXISTS goals
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_goals_tenant ON goals(tenant_id);

-- time_off_requests
ALTER TABLE IF EXISTS time_off_requests
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_time_off_requests_tenant ON time_off_requests(tenant_id);

-- announcements
ALTER TABLE IF EXISTS announcements
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_announcements_tenant ON announcements(tenant_id);

-- ============================================
-- CareFlow Tables (if they exist)
-- ============================================

-- clients
ALTER TABLE IF EXISTS clients
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);

-- care_plans
ALTER TABLE IF EXISTS care_plans
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_care_plans_tenant ON care_plans(tenant_id);

-- visits
ALTER TABLE IF EXISTS visits
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_visits_tenant ON visits(tenant_id);

-- medication_records
ALTER TABLE IF EXISTS medication_records
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_medication_records_tenant ON medication_records(tenant_id);

-- care_notes
ALTER TABLE IF EXISTS care_notes
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_care_notes_tenant ON care_notes(tenant_id);

-- ============================================
-- Backfill tenant_id for Existing Data (SAFE)
-- ============================================

DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Get Ringstead Care tenant (or first tenant)
    SELECT id INTO default_tenant_id
    FROM tenants
    WHERE subdomain = 'ringsteadcare'
       OR slug = 'ringsteadcare'
    LIMIT 1;
    
    -- If no tenant exists, create one
    IF default_tenant_id IS NULL THEN
        INSERT INTO tenants (name, subdomain, slug, subscription_tier, subscription_status)
        VALUES ('Default Organization', 'default', 'default', 'enterprise', 'active')
        RETURNING id INTO default_tenant_id;
    END IF;
    
    -- Backfill users_profiles (always exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users_profiles') THEN
        UPDATE users_profiles 
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled users_profiles';
    END IF;
    
    -- Backfill employees (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
        UPDATE employees
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled employees';
    END IF;
    
    -- Backfill job_postings (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_postings') THEN
        UPDATE job_postings
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled job_postings';
    END IF;
    
    -- Backfill applications (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'applications') THEN
        UPDATE applications
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled applications';
    END IF;
    
    -- Backfill interviews (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interviews') THEN
        UPDATE interviews
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled interviews';
    END IF;
    
    -- Backfill documents (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') THEN
        UPDATE documents
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled documents';
    END IF;
    
    -- Backfill training_records (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'training_records') THEN
        UPDATE training_records
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled training_records';
    END IF;
    
    -- Backfill reviews (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
        UPDATE reviews
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled reviews';
    END IF;
    
    -- Backfill goals (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'goals') THEN
        UPDATE goals
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled goals';
    END IF;
    
    -- Backfill time_off_requests (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'time_off_requests') THEN
        UPDATE time_off_requests
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled time_off_requests';
    END IF;
    
    -- Backfill announcements (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'announcements') THEN
        UPDATE announcements
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled announcements';
    END IF;
    
    -- CareFlow tables (if exist)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        UPDATE clients
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled clients';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'care_plans') THEN
        UPDATE care_plans
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled care_plans';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'visits') THEN
        UPDATE visits
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled visits';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'medication_records') THEN
        UPDATE medication_records
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled medication_records';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'care_notes') THEN
        UPDATE care_notes
        SET tenant_id = default_tenant_id
        WHERE tenant_id IS NULL;
        RAISE NOTICE 'Backfilled care_notes';
    END IF;
    
    RAISE NOTICE '✅ Backfill complete! Default tenant: %', default_tenant_id;
END $$;

-- ============================================
-- Helper function for tenant access
-- ============================================

CREATE OR REPLACE FUNCTION user_has_tenant_access(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_tenant_memberships
        WHERE user_id = auth.uid()
          AND tenant_id = p_tenant_id
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Apply RLS Policies to Core Tables
-- ============================================

-- users_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON users_profiles;
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON users_profiles;
CREATE POLICY "Users can view profiles in their tenant"
ON users_profiles FOR SELECT
USING (
    user_id = auth.uid()
    OR user_has_tenant_access(tenant_id)
);

DROP POLICY IF EXISTS "Users can update own profile" ON users_profiles;
CREATE POLICY "Users can update own profile"
ON users_profiles FOR UPDATE
USING (user_id = auth.uid());

-- employees (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
        DROP POLICY IF EXISTS "tenant_isolation_policy" ON employees;
        DROP POLICY IF EXISTS "Users can access employees in their tenant" ON employees;
        CREATE POLICY "Users can access employees in their tenant"
        ON employees FOR ALL
        USING (user_has_tenant_access(tenant_id));
        RAISE NOTICE 'Created RLS policy for employees';
    END IF;
END $$;

-- job_postings (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_postings') THEN
        DROP POLICY IF EXISTS "tenant_isolation" ON job_postings;
        DROP POLICY IF EXISTS "Users can access job postings in their tenant" ON job_postings;
        CREATE POLICY "Users can access job postings in their tenant"
        ON job_postings FOR ALL
        USING (user_has_tenant_access(tenant_id));
        RAISE NOTICE 'Created RLS policy for job_postings';
    END IF;
END $$;

-- applications (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'applications') THEN
        DROP POLICY IF EXISTS "tenant_access_policy" ON applications;
        DROP POLICY IF EXISTS "Users can access applications in their tenant" ON applications;
        CREATE POLICY "Users can access applications in their tenant"
        ON applications FOR ALL
        USING (user_has_tenant_access(tenant_id));
        RAISE NOTICE 'Created RLS policy for applications';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 002 complete!';
    RAISE NOTICE 'Added tenant_id to all tables';
    RAISE NOTICE 'Backfilled existing data';
    RAISE NOTICE 'Updated RLS policies for tenant isolation';
END $$;
