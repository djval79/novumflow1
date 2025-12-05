-- Fix Multi-Tenant Data Isolation with RLS Policies
-- This migration adds proper Row Level Security policies to ensure tenant data isolation

-- Enable RLS on recruitment tables
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

-- Job Postings Policies
CREATE POLICY "Users can view their tenant's job postings"
    ON job_postings FOR SELECT
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can insert job postings for their tenant"
    ON job_postings FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can update their tenant's job postings"
    ON job_postings FOR UPDATE
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can delete their tenant's job postings"
    ON job_postings FOR DELETE
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Applications Policies
CREATE POLICY "Users can view their tenant's applications"
    ON applications FOR SELECT
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can insert applications for their tenant"
    ON applications FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can update their tenant's applications"
    ON applications FOR UPDATE
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can delete their tenant's applications"
    ON applications FOR DELETE
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Interviews Policies
CREATE POLICY "Users can view their tenant's interviews"
    ON interviews FOR SELECT
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can insert interviews for their tenant"
    ON interviews FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can update their tenant's interviews"
    ON interviews FOR UPDATE
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can delete their tenant's interviews"
    ON interviews FOR DELETE
    TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Add comment
COMMENT ON TABLE job_postings IS 'RLS enabled: Users can only access job postings from tenants they belong to';
COMMENT ON TABLE applications IS 'RLS enabled: Users can only access applications from tenants they belong to';
COMMENT ON TABLE interviews IS 'RLS enabled: Users can only access interviews from tenants they belong to';
