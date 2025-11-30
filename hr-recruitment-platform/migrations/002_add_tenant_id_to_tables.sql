-- ============================================
-- Phase 1: Multi-Tenant Database Schema
-- Step 2: Add tenant_id to Existing Tables
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
-- Backfill tenant_id for Existing Data
-- ============================================

-- Get the default tenant
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
    
    -- Backfill users_profiles
    UPDATE users_profiles 
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    -- Backfill employees
    UPDATE employees
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    -- Backfill job_postings
    UPDATE job_postings
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    -- Backfill applications
    UPDATE applications
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    -- Backfill interviews
    UPDATE interviews
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    -- Backfill documents
    UPDATE documents
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    -- Backfill training_records
    UPDATE training_records
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    -- Backfill reviews
    UPDATE reviews
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    -- Backfill goals
    UPDATE goals
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    -- Backfill time_off_requests
    UPDATE time_off_requests
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    -- Backfill announcements
    UPDATE announcements
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    -- CareFlow tables
    UPDATE clients
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    UPDATE care_plans
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    UPDATE visits
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    UPDATE medication_records
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    UPDATE care_notes
    SET tenant_id = default_tenant_id
    WHERE tenant_id IS NULL;
    
    RAISE NOTICE 'Backfilled all tables with default tenant: %', default_tenant_id;
END $$;

-- ============================================
-- Update RLS Policies for Tenant Isolation
-- ============================================

-- Helper function to check if user has tenant access
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

-- employees
DROP POLICY IF EXISTS "tenant_isolation_policy" ON employees;
CREATE POLICY "Users can access employees in their tenant"
ON employees FOR ALL
USING (user_has_tenant_access(tenant_id));

-- job_postings
DROP POLICY IF EXISTS "tenant_isolation" ON job_postings;
CREATE POLICY "Users can access job postings in their tenant"
ON job_postings FOR ALL
USING (user_has_tenant_access(tenant_id));

-- applications
DROP POLICY IF EXISTS "tenant_access_policy" ON applications;
CREATE POLICY "Users can access applications in their tenant"
ON applications FOR ALL
USING (user_has_tenant_access(tenant_id));

-- interviews
DROP POLICY IF EXISTS "Users can view all interviews" ON interviews;
CREATE POLICY "Users can access interviews in their tenant"
ON interviews FOR ALL
USING (user_has_tenant_access(tenant_id));

-- documents
DROP POLICY IF EXISTS "Users can view all documents" ON documents;
CREATE POLICY "Users can access documents in their tenant"
ON documents FOR ALL
USING (user_has_tenant_access(tenant_id));

-- training_records
DROP POLICY IF EXISTS "Users can view all training records" ON training_records;
CREATE POLICY "Users can access training records in their tenant"
ON training_records FOR ALL
USING (user_has_tenant_access(tenant_id));

-- reviews
DROP POLICY IF EXISTS "Users can view all reviews" ON reviews;
CREATE POLICY "Users can access reviews in their tenant"
ON reviews FOR ALL
USING (user_has_tenant_access(tenant_id));

-- goals
DROP POLICY IF EXISTS "Users can view all goals" ON goals;
CREATE POLICY "Users can access goals in their tenant"
ON goals FOR ALL
USING (user_has_tenant_access(tenant_id));

-- time_off_requests
DROP POLICY IF EXISTS "Users can view all requests" ON time_off_requests;
CREATE POLICY "Users can access time off requests in their tenant"
ON time_off_requests FOR ALL
USING (user_has_tenant_access(tenant_id));

-- announcements
DROP POLICY IF EXISTS "Users can view all announcements" ON announcements;
CREATE POLICY "Users can access announcements in their tenant"
ON announcements FOR ALL
USING (user_has_tenant_access(tenant_id));

-- ============================================
-- CareFlow RLS Policies (if tables exist)
-- ============================================

-- clients
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        DROP POLICY IF EXISTS "Users can view all clients" ON clients;
        CREATE POLICY "Users can access clients in their tenant"
        ON clients FOR ALL
        USING (user_has_tenant_access(tenant_id));
    END IF;
END $$;

-- care_plans
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'care_plans') THEN
        DROP POLICY IF EXISTS "Users can view all care plans" ON care_plans;
        CREATE POLICY "Users can access care plans in their tenant"
        ON care_plans FOR ALL
        USING (user_has_tenant_access(tenant_id));
    END IF;
END $$;

-- visits
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'visits') THEN
        DROP POLICY IF EXISTS "Users can view all visits" ON visits;
        CREATE POLICY "Users can access visits in their tenant"
        ON visits FOR ALL
        USING (user_has_tenant_access(tenant_id));
    END IF;
END $$;

-- medication_records
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'medication_records') THEN
        DROP POLICY IF EXISTS "Users can view all medication records" ON medication_records;
        CREATE POLICY "Users can access medication records in their tenant"
        ON medication_records FOR ALL
        USING (user_has_tenant_access(tenant_id));
    END IF;
END $$;

-- care_notes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'care_notes') THEN
        DROP POLICY IF EXISTS "Users can view all care notes" ON care_notes;
        CREATE POLICY "Users can access care notes in their tenant"
        ON care_notes FOR ALL
        USING (user_has_tenant_access(tenant_id));
    END IF;
END $$;

-- ============================================
-- Verification Queries
-- ============================================

-- Check tenant_id has been added
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name = 'tenant_id'
  AND table_schema = 'public'
ORDER BY table_name;

-- Check data has been backfilled
SELECT 
    'users_profiles' as table_name,
    COUNT(*) as total_rows,
    COUNT(tenant_id) as rows_with_tenant
FROM users_profiles

UNION ALL

SELECT 
    'employees',
    COUNT(*),
    COUNT(tenant_id)
FROM employees

UNION ALL

SELECT 
    'job_postings',
    COUNT(*),
    COUNT(tenant_id)
FROM job_postings;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE tablename IN ('users_profiles', 'employees', 'job_postings', 'applications')
ORDER BY tablename, policyname;
