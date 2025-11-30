-- ============================================
-- FIX SECURITY LINTS: ENABLE RLS
-- ============================================

-- 1. Enable RLS on tenant_onboarding
-- The user reported that policies already exist, so we just need to enable RLS.
ALTER TABLE IF EXISTS public.tenant_onboarding ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on tenant_api_keys
ALTER TABLE IF EXISTS public.tenant_api_keys ENABLE ROW LEVEL SECURITY;

-- 3. Add policies for tenant_api_keys if they don't exist
-- By default, enabling RLS denies all access. We should ensure admins can manage keys.

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Super admins can manage api keys" ON public.tenant_api_keys;

-- Create policy using the secure function we created in 005
CREATE POLICY "Super admins can manage api keys" ON public.tenant_api_keys
    FOR ALL USING (public.is_admin_or_super());

-- 4. Double check tenant_onboarding policies
-- Just in case, let's ensure the policies mentioned in the error actually work with our new secure functions

DROP POLICY IF EXISTS "Super admins can view all onboarding" ON public.tenant_onboarding;
DROP POLICY IF EXISTS "Super admins can insert onboarding" ON public.tenant_onboarding;
DROP POLICY IF EXISTS "Super admins can update onboarding" ON public.tenant_onboarding;
DROP POLICY IF EXISTS "Super admins can delete onboarding" ON public.tenant_onboarding;

CREATE POLICY "Super admins can view all onboarding" ON public.tenant_onboarding
    FOR SELECT USING (public.is_admin_or_super());

CREATE POLICY "Super admins can insert onboarding" ON public.tenant_onboarding
    FOR INSERT WITH CHECK (public.is_admin_or_super());

CREATE POLICY "Super admins can update onboarding" ON public.tenant_onboarding
    FOR UPDATE USING (public.is_admin_or_super());

CREATE POLICY "Super admins can delete onboarding" ON public.tenant_onboarding
    FOR DELETE USING (public.is_admin_or_super());
