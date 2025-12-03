-- ============================================
-- FINAL NUCLEAR RESET: Fix All Login Loops
-- ============================================

-- 1. Define Safe Admin Check (Security Definer)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE user_id = auth.uid()
    AND (role = 'admin' OR is_super_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Define Safe Tenant Fetcher (Security Definer)
-- This prevents RLS recursion when fetching tenants
CREATE OR REPLACE FUNCTION public.get_my_tenants()
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    subdomain TEXT,
    logo_url TEXT,
    subscription_status TEXT,
    features JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, t.slug, t.subdomain, t.logo_url, t.subscription_status::TEXT, t.features
    FROM public.tenants t
    JOIN public.user_tenant_memberships m ON m.tenant_id = t.id
    WHERE m.user_id = auth.uid() AND m.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. DYNAMICALLY DROP ALL POLICIES (Clears hidden ones)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- users_profiles
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'users_profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users_profiles', r.policyname);
    END LOOP;

    -- tenants
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'tenants' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenants', r.policyname);
    END LOOP;

    -- user_tenant_memberships
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'user_tenant_memberships' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_tenant_memberships', r.policyname);
    END LOOP;
END $$;

-- 4. RE-APPLY SAFE POLICIES

-- A. Users Profiles
CREATE POLICY "allow_read_own_profile" ON public.users_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "allow_update_own_profile" ON public.users_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "allow_insert_own_profile" ON public.users_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_admin_all_profiles" ON public.users_profiles
    FOR ALL USING (public.is_admin());

-- B. Tenants (Strict Isolation)
CREATE POLICY "allow_read_my_tenants" ON public.tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_tenant_memberships
            WHERE user_id = auth.uid() 
            AND tenant_id = public.tenants.id 
            AND is_active = true
        )
    );

CREATE POLICY "allow_admin_all_tenants" ON public.tenants
    FOR ALL USING (public.is_admin());

-- C. Memberships
CREATE POLICY "allow_read_own_memberships" ON public.user_tenant_memberships
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "allow_admin_all_memberships" ON public.user_tenant_memberships
    FOR ALL USING (public.is_admin());

-- 5. FORCE ADMIN PROFILE (Just in case)
INSERT INTO public.users_profiles (user_id, email, full_name, role, is_active, is_super_admin)
SELECT id, email, 'Mr Sonirie', 'admin', true, true
FROM auth.users WHERE email = 'mrsonirie@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET is_super_admin = true, role = 'admin', is_active = true;
