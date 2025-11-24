-- Temporary fix: Disable RLS on tenant_onboarding to allow operations
-- This will let the onboarding system work while we debug the RLS issue
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE tenant_onboarding DISABLE ROW LEVEL SECURITY;

-- Note: This makes the table accessible to all authenticated users
-- We'll re-enable RLS with proper policies once we verify the super_admin field
