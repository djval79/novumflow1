-- ============================================
-- FIX RLS RECURSION & BACKFILL PROFILES
-- ============================================

-- 0. Drop restrictive constraints if they exist
ALTER TABLE public.users_profiles DROP CONSTRAINT IF EXISTS users_profiles_role_check;

-- 1. Create SECURITY DEFINER functions to safely check permissions without triggering RLS loops

-- Check if user is a global admin or super admin
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
  -- This runs as the function creator (superuser), bypassing RLS
  RETURN EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR is_super_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has access to a tenant (for tenant policies)
CREATE OR REPLACE FUNCTION public.has_tenant_role(check_tenant_id UUID, required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_tenant_memberships
    WHERE user_id = auth.uid()
    AND tenant_id = check_tenant_id
    AND role = ANY(required_roles)
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Fix users_profiles Policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users_profiles;

-- Use the function instead of direct table query
CREATE POLICY "Admins can view all profiles" ON public.users_profiles
    FOR SELECT USING (public.is_admin_or_super());

-- ============================================
-- 3. Fix user_tenant_memberships Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view their memberships" ON public.user_tenant_memberships;

-- Split into two simple policies to avoid OR recursion complexity, or use the function
CREATE POLICY "Users can view own memberships" ON public.user_tenant_memberships
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view tenant memberships" ON public.user_tenant_memberships
    FOR SELECT USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin'])
    );

-- ============================================
-- 4. Backfill Missing Profiles
-- ============================================

-- Insert profiles for existing users who don't have one
INSERT INTO public.users_profiles (user_id, email, full_name, role, is_active, is_super_admin)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'User'), 
    COALESCE(raw_user_meta_data->>'role', 'carer'), 
    true,
    CASE WHEN email = 'mrsonirie@gmail.com' THEN true ELSE false END
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.users_profiles WHERE user_id = auth.users.id
);

-- Ensure mrsonirie@gmail.com is super admin
UPDATE public.users_profiles
SET is_super_admin = true, role = 'admin'
WHERE email = 'mrsonirie@gmail.com';

-- ============================================
-- 5. Fix Tenants Policies (Just in case)
-- ============================================

DROP POLICY IF EXISTS "Users can view their tenants" ON public.tenants;

CREATE POLICY "Users can view their tenants" ON public.tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_tenant_memberships
            WHERE user_id = auth.uid() 
            AND tenant_id = public.tenants.id 
            AND is_active = true
        )
    );
-- Note: The above is standard and usually safe, but if user_tenant_memberships has RLS, it checks that.
-- Since we fixed user_tenant_memberships RLS above, this should be fine. 
-- But to be 100% safe, we can use a security definer here too if needed. 
-- For now, let's assume the membership fix is enough.

