-- Fix RLS policies for tenant_onboarding to allow frontend fallback creation
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Super admins can view all onboarding" ON tenant_onboarding;
DROP POLICY IF EXISTS "Super admins can manage onboarding" ON tenant_onboarding;
DROP POLICY IF EXISTS "Super admins can insert onboarding" ON tenant_onboarding;
DROP POLICY IF EXISTS "Super admins can update onboarding" ON tenant_onboarding;
DROP POLICY IF EXISTS "Super admins can delete onboarding" ON tenant_onboarding;

-- Create separate policies for different operations
-- Allow super admins to SELECT
CREATE POLICY "Super admins can view all onboarding" ON tenant_onboarding
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE users_profiles.id = auth.uid()
            AND users_profiles.is_super_admin = true
        )
    );

-- Allow super admins to INSERT (for manual creation)
CREATE POLICY "Super admins can insert onboarding" ON tenant_onboarding
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE users_profiles.id = auth.uid()
            AND users_profiles.is_super_admin = true
        )
    );

-- Allow super admins to UPDATE
CREATE POLICY "Super admins can update onboarding" ON tenant_onboarding
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE users_profiles.id = auth.uid()
            AND users_profiles.is_super_admin = true
        )
    );

-- Allow super admins to DELETE
CREATE POLICY "Super admins can delete onboarding" ON tenant_onboarding
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE users_profiles.id = auth.uid()
            AND users_profiles.is_super_admin = true
        )
    );
