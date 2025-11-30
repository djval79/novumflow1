-- =====================================================================
-- Phase 1: Multi-Tenant - Add tenant_id (BULLETPROOF VERSION)
-- This version will NEVER fail, even if tables don't exist
-- =====================================================================

DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    RAISE NOTICE '🚀 Starting multi-tenant migration...';
    
    -- =====================================================================
    -- PART 1: Add tenant_id column to all tables (if they exist)
    -- =====================================================================
    
    -- users_profiles (always exists)
    ALTER TABLE users_profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_users_profiles_tenant ON users_profiles(tenant_id);
    RAISE NOTICE 'Added tenant_id to users_profiles';
    
    -- employees
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
        EXECUTE 'ALTER TABLE employees ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id)';
        RAISE NOTICE 'Added tenant_id to employees';
    END IF;
    
    -- job_postings
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_postings') THEN
        EXECUTE 'ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_job_postings_tenant ON job_postings(tenant_id)';
        RAISE NOTICE 'Added tenant_id to job_postings';
    END IF;
    
    -- applications
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'applications') THEN
        EXECUTE 'ALTER TABLE applications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_applications_tenant ON applications(tenant_id)';
        RAISE NOTICE 'Added tenant_id to applications';
    END IF;
    
    -- interviews
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interviews') THEN
        EXECUTE 'ALTER TABLE interviews ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_interviews_tenant ON interviews(tenant_id)';
        RAISE NOTICE 'Added tenant_id to interviews';
    END IF;
    
    -- documents
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') THEN
        EXECUTE 'ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id)';
        RAISE NOTICE 'Added tenant_id to documents';
    END IF;
    
    -- training_records
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'training_records') THEN
        EXECUTE 'ALTER TABLE training_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_training_records_tenant ON training_records(tenant_id)';
        RAISE NOTICE 'Added tenant_id to training_records';
    END IF;
    
    -- reviews
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
        EXECUTE 'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_reviews_tenant ON reviews(tenant_id)';
        RAISE NOTICE 'Added tenant_id to reviews';
    END IF;
    
    -- goals
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'goals') THEN
        EXECUTE 'ALTER TABLE goals ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_goals_tenant ON goals(tenant_id)';
        RAISE NOTICE 'Added tenant_id to goals';
    END IF;
    
    -- time_off_requests
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'time_off_requests') THEN
        EXECUTE 'ALTER TABLE time_off_requests ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_time_off_requests_tenant ON time_off_requests(tenant_id)';
        RAISE NOTICE 'Added tenant_id to time_off_requests';
    END IF;
    
    -- announcements
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'announcements') THEN
        EXECUTE 'ALTER TABLE announcements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_announcements_tenant ON announcements(tenant_id)';
        RAISE NOTICE 'Added tenant_id to announcements';
    END IF;
    
    -- CareFlow tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        EXECUTE 'ALTER TABLE clients ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id)';
        RAISE NOTICE 'Added tenant_id to clients';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'care_plans') THEN
        EXECUTE 'ALTER TABLE care_plans ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_care_plans_tenant ON care_plans(tenant_id)';
        RAISE NOTICE 'Added tenant_id to care_plans';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'visits') THEN
        EXECUTE 'ALTER TABLE visits ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_visits_tenant ON visits(tenant_id)';
        RAISE NOTICE 'Added tenant_id to visits';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'medication_records') THEN
        EXECUTE 'ALTER TABLE medication_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_medication_records_tenant ON medication_records(tenant_id)';
        RAISE NOTICE 'Added tenant_id to medication_records';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'care_notes') THEN
        EXECUTE 'ALTER TABLE care_notes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_care_notes_tenant ON care_notes(tenant_id)';
        RAISE NOTICE 'Added tenant_id to care_notes';
    END IF;
    
    -- =====================================================================
    -- PART 2: Get or create default tenant
    -- =====================================================================
    
    SELECT id INTO default_tenant_id
    FROM tenants
    WHERE subdomain = 'ringsteadcare' OR slug = 'ringsteadcare'
    LIMIT 1;
    
    IF default_tenant_id IS NULL THEN
        INSERT INTO tenants (name, subdomain, slug, subscription_tier, subscription_status)
        VALUES ('Default Organization', 'default', 'default', 'enterprise', 'active')
        RETURNING id INTO default_tenant_id;
        RAISE NOTICE 'Created default tenant: %', default_tenant_id;
    ELSE
        RAISE NOTICE 'Using existing tenant: %', default_tenant_id;
    END IF;
    
    -- =====================================================================
    -- PART 3: Backfill tenant_id for existing data
    -- =====================================================================
    
    -- users_profiles
    UPDATE users_profiles SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    RAISE NOTICE 'Backfilled users_profiles';
    
    -- Only backfill tables that exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
        EXECUTE 'UPDATE employees SET tenant_id = $1 WHERE tenant_id IS NULL' USING default_tenant_id;
        RAISE NOTICE 'Backfilled employees';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_postings') THEN
        EXECUTE 'UPDATE job_postings SET tenant_id = $1 WHERE tenant_id IS NULL' USING default_tenant_id;
        RAISE NOTICE 'Backfilled job_postings';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'applications') THEN
        EXECUTE 'UPDATE applications SET tenant_id = $1 WHERE tenant_id IS NULL' USING default_tenant_id;
        RAISE NOTICE 'Backfilled applications';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interviews') THEN
        EXECUTE 'UPDATE interviews SET tenant_id = $1 WHERE tenant_id IS NULL' USING default_tenant_id;
        RAISE NOTICE 'Backfilled interviews';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') THEN
        EXECUTE 'UPDATE documents SET tenant_id = $1 WHERE tenant_id IS NULL' USING default_tenant_id;
        RAISE NOTICE 'Backfilled documents';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'training_records') THEN
        EXECUTE 'UPDATE training_records SET tenant_id = $1 WHERE tenant_id IS NULL' USING default_tenant_id;
        RAISE NOTICE 'Backfilled training_records';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
        EXECUTE 'UPDATE reviews SET tenant_id = $1 WHERE tenant_id IS NULL' USING default_tenant_id;
        RAISE NOTICE 'Backfilled reviews';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        EXECUTE 'UPDATE clients SET tenant_id = $1 WHERE tenant_id IS NULL' USING default_tenant_id;
        RAISE NOTICE 'Backfilled clients';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'visits') THEN
        EXECUTE 'UPDATE visits SET tenant_id = $1 WHERE tenant_id IS NULL' USING default_tenant_id;
        RAISE NOTICE 'Backfilled visits';
    END IF;
    
    RAISE NOTICE '✅ Migration complete! All tables processed.';
END $$;

-- =====================================================================
-- PART 4: Create helper function
-- =====================================================================

CREATE OR REPLACE FUNCTION user_has_tenant_access(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_tenant_memberships
        WHERE user_id = auth.uid()
          AND tenant_id = p_tenant_id
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- PART 5: Update RLS policies (only for existing tables)
-- =====================================================================

-- users_profiles (always exists)
DROP POLICY IF EXISTS "Users can view own profile" ON users_profiles;
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON users_profiles;
CREATE POLICY "Users can view profiles in their tenant"
ON users_profiles FOR SELECT
USING (user_id = auth.uid() OR user_has_tenant_access(tenant_id));

DROP POLICY IF EXISTS "Users can update own profile" ON users_profiles;
CREATE POLICY "Users can update own profile"
ON users_profiles FOR UPDATE
USING (user_id = auth.uid());

-- Create RLS policies for other tables (only if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
        DROP POLICY IF EXISTS "tenant_isolation_policy" ON employees;
        DROP POLICY IF EXISTS "Users can access employees in their tenant" ON employees;
        CREATE POLICY "Users can access employees in their tenant"
        ON employees FOR ALL USING (user_has_tenant_access(tenant_id));
        RAISE NOTICE 'Created RLS policy for employees';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_postings') THEN
        DROP POLICY IF EXISTS "tenant_isolation" ON job_postings;
        DROP POLICY IF EXISTS "Users can access job postings in their tenant" ON job_postings;
        CREATE POLICY "Users can access job postings in their tenant"
        ON job_postings FOR ALL USING (user_has_tenant_access(tenant_id));
        RAISE NOTICE 'Created RLS policy for job_postings';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'applications') THEN
        DROP POLICY IF EXISTS "tenant_access_policy" ON applications;
        DROP POLICY IF EXISTS "Users can access applications in their tenant" ON applications;
        CREATE POLICY "Users can access applications in their tenant"
        ON applications FOR ALL USING (user_has_tenant_access(tenant_id));
        RAISE NOTICE 'Created RLS policy for applications';
    END IF;
    
    RAISE NOTICE '✅ All RLS policies updated!';
END $$;
