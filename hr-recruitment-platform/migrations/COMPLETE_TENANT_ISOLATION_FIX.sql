-- ============================================================================
-- COMPLETE MULTI-TENANT ISOLATION FIX
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Fix NULL tenant_id values
-- ============================================================================
DO $$
DECLARE
    default_tenant_id UUID;
    ringstead_tenant_id UUID;
BEGIN
    -- Find Ringstead tenant
    SELECT id INTO ringstead_tenant_id
    FROM tenants
    WHERE name ILIKE '%ringstead%'
    ORDER BY created_at
    LIMIT 1;

    -- If Ringstead not found, use first tenant
    IF ringstead_tenant_id IS NULL THEN
        SELECT id INTO ringstead_tenant_id
        FROM tenants
        WHERE is_active = true
        ORDER BY created_at
        LIMIT 1;
    END IF;

    RAISE NOTICE 'Using Ringstead tenant ID: %', ringstead_tenant_id;

    -- Update job_postings
    UPDATE job_postings
    SET tenant_id = ringstead_tenant_id
    WHERE tenant_id IS NULL;

    RAISE NOTICE 'Updated % job_postings', 
        (SELECT COUNT(*) FROM job_postings WHERE tenant_id = ringstead_tenant_id);

    -- Update applications
    UPDATE applications
    SET tenant_id = ringstead_tenant_id
    WHERE tenant_id IS NULL;

    RAISE NOTICE 'Updated % applications', 
        (SELECT COUNT(*) FROM applications WHERE tenant_id = ringstead_tenant_id);

    -- Update interviews
    UPDATE interviews
    SET tenant_id = ringstead_tenant_id
    WHERE tenant_id IS NULL;

    RAISE NOTICE 'Updated % interviews', 
        (SELECT COUNT(*) FROM interviews WHERE tenant_id = ringstead_tenant_id);
END $$;

-- Make tenant_id NOT NULL
ALTER TABLE job_postings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE applications ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE interviews ALTER COLUMN tenant_id SET NOT NULL;

-- STEP 2: Set super admin role
-- ============================================================================
UPDATE users_profiles
SET role = 'super_admin'
WHERE user_id IN (
    SELECT id 
    FROM auth.users 
    WHERE email IN ('mrsonirie@gmail.com', 'hr@ringsteadcare.com')
);

-- STEP 3: Create super admin check function
-- ============================================================================
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM users_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Drop old RLS policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their tenant's job postings" ON job_postings;
DROP POLICY IF EXISTS "Users can insert job postings for their tenant" ON job_postings;
DROP POLICY IF EXISTS "Users can update their tenant's job postings" ON job_postings;
DROP POLICY IF EXISTS "Users can delete their tenant's job postings" ON job_postings;
DROP POLICY IF EXISTS "Users can view their tenant's applications" ON applications;
DROP POLICY IF EXISTS "Users can insert applications for their tenant" ON applications;
DROP POLICY IF EXISTS "Users can update their tenant's applications" ON applications;
DROP POLICY IF EXISTS "Users can delete their tenant's applications" ON applications;
DROP POLICY IF EXISTS "Users can view their tenant's interviews" ON interviews;
DROP POLICY IF EXISTS "Users can insert interviews for their tenant" ON interviews;
DROP POLICY IF EXISTS "Users can update their tenant's interviews" ON interviews;
DROP POLICY IF EXISTS "Users can delete their tenant's interviews" ON interviews;

-- STEP 5: Create new RLS policies with super admin support
-- ============================================================================

-- JOB POSTINGS
CREATE POLICY "Super admins see all job postings"
    ON job_postings FOR SELECT
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Tenant users see their job postings"
    ON job_postings FOR SELECT
    TO authenticated
    USING (
        NOT is_super_admin() 
        AND tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Super admins can modify all job postings"
    ON job_postings FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

CREATE POLICY "Tenant users can modify their job postings"
    ON job_postings FOR ALL
    TO authenticated
    USING (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    )
    WITH CHECK (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- APPLICATIONS
CREATE POLICY "Super admins see all applications"
    ON applications FOR SELECT
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Tenant users see their applications"
    ON applications FOR SELECT
    TO authenticated
    USING (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Super admins can modify all applications"
    ON applications FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

CREATE POLICY "Tenant users can modify their applications"
    ON applications FOR ALL
    TO authenticated
    USING (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    )
    WITH CHECK (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- INTERVIEWS
CREATE POLICY "Super admins see all interviews"
    ON interviews FOR SELECT
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Tenant users see their interviews"
    ON interviews FOR SELECT
    TO authenticated
    USING (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Super admins can modify all interviews"
    ON interviews FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

CREATE POLICY "Tenant users can modify their interviews"
    ON interviews FOR ALL
    TO authenticated
    USING (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    )
    WITH CHECK (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- STEP 6: Create trigger for auto-assigning tenant_id
-- ============================================================================
CREATE OR REPLACE FUNCTION set_tenant_id_from_context()
RETURNS TRIGGER AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    IF NEW.tenant_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Get tenant from user's first membership
    SELECT tenant_id INTO current_tenant_id
    FROM user_tenant_memberships
    WHERE user_id = auth.uid()
    AND is_active = true
    ORDER BY joined_at
    LIMIT 1;

    -- Fallback to first active tenant
    IF current_tenant_id IS NULL THEN
        SELECT id INTO current_tenant_id
        FROM tenants
        WHERE is_active = true
        ORDER BY created_at
        LIMIT 1;
    END IF;

    NEW.tenant_id := current_tenant_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_job_posting_tenant ON job_postings;
CREATE TRIGGER set_job_posting_tenant
    BEFORE INSERT ON job_postings
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_from_context();

DROP TRIGGER IF EXISTS set_application_tenant ON applications;
CREATE TRIGGER set_application_tenant
    BEFORE INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_from_context();

DROP TRIGGER IF EXISTS set_interview_tenant ON interviews;
CREATE TRIGGER set_interview_tenant
    BEFORE INSERT ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION set_tenant_id_from_context();

-- STEP 7: Verification
-- ============================================================================
SELECT 
    'Super Admin Status' as check_type,
    u.email,
    up.role
FROM users_profiles up
JOIN auth.users u ON u.id = up.user_id
WHERE up.role = 'super_admin'

UNION ALL

SELECT 
    'Tenant Data Distribution',
    t.name,
    CAST(COUNT(jp.id) AS TEXT)
FROM job_postings jp
JOIN tenants t ON t.id = jp.tenant_id
GROUP BY t.name;

-- Done!
SELECT 'Migration completed successfully!' as status;
