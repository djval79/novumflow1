-- Correct RLS Policies for Multi-Tenant SaaS Platform
-- Super admins see everything, tenant users see only their tenant's data

-- First, let's check if you have a super_admin flag in users_profiles
-- If not, we'll use a different approach

-- Drop existing policies
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

-- Create helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has super_admin role in users_profiles
    RETURN EXISTS (
        SELECT 1 
        FROM users_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- JOB POSTINGS POLICIES
CREATE POLICY "Super admins see all job postings"
    ON job_postings FOR SELECT
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Tenant users see their tenant's job postings"
    ON job_postings FOR SELECT
    TO authenticated
    USING (
        NOT is_super_admin() 
        AND tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can insert any job posting"
    ON job_postings FOR INSERT
    TO authenticated
    WITH CHECK (is_super_admin());

CREATE POLICY "Tenant users can insert job postings for their tenant"
    ON job_postings FOR INSERT
    TO authenticated
    WITH CHECK (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can update any job posting"
    ON job_postings FOR UPDATE
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Tenant users can update their tenant's job postings"
    ON job_postings FOR UPDATE
    TO authenticated
    USING (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can delete any job posting"
    ON job_postings FOR DELETE
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Tenant users can delete their tenant's job postings"
    ON job_postings FOR DELETE
    TO authenticated
    USING (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- APPLICATIONS POLICIES (same pattern)
CREATE POLICY "Super admins see all applications"
    ON applications FOR SELECT
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Tenant users see their tenant's applications"
    ON applications FOR SELECT
    TO authenticated
    USING (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can insert any application"
    ON applications FOR INSERT
    TO authenticated
    WITH CHECK (is_super_admin());

CREATE POLICY "Tenant users can insert applications for their tenant"
    ON applications FOR INSERT
    TO authenticated
    WITH CHECK (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can update any application"
    ON applications FOR UPDATE
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Tenant users can update their tenant's applications"
    ON applications FOR UPDATE
    TO authenticated
    USING (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can delete any application"
    ON applications FOR DELETE
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Tenant users can delete their tenant's applications"
    ON applications FOR DELETE
    TO authenticated
    USING (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- INTERVIEWS POLICIES (same pattern)
CREATE POLICY "Super admins see all interviews"
    ON interviews FOR SELECT
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Tenant users see their tenant's interviews"
    ON interviews FOR SELECT
    TO authenticated
    USING (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can insert any interview"
    ON interviews FOR INSERT
    TO authenticated
    WITH CHECK (is_super_admin());

CREATE POLICY "Tenant users can insert interviews for their tenant"
    ON interviews FOR INSERT
    TO authenticated
    WITH CHECK (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can update any interview"
    ON interviews FOR UPDATE
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Tenant users can update their tenant's interviews"
    ON interviews FOR UPDATE
    TO authenticated
    USING (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Super admins can delete any interview"
    ON interviews FOR DELETE
    TO authenticated
    USING (is_super_admin());

CREATE POLICY "Tenant users can delete their tenant's interviews"
    ON interviews FOR DELETE
    TO authenticated
    USING (
        NOT is_super_admin()
        AND tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Verify the setup
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename IN ('job_postings', 'applications', 'interviews')
ORDER BY tablename, policyname;
