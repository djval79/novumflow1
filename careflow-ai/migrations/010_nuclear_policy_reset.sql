-- ============================================
-- NUCLEAR OPTION: RESET ALL POLICIES
-- ============================================

-- This script dynamically finds and drops ALL policies for the core tables.
-- This ensures that no "hidden" or "renamed" policies are left behind causing loops.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Drop ALL policies on users_profiles
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'users_profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users_profiles', r.policyname);
    END LOOP;

    -- 2. Drop ALL policies on user_tenant_memberships
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'user_tenant_memberships' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_tenant_memberships', r.policyname);
    END LOOP;

    -- 3. Drop ALL policies on tenants
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'tenants' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenants', r.policyname);
    END LOOP;
END $$;

-- ============================================
-- RE-APPLY SAFE POLICIES
-- ============================================

-- 1. Users Profiles (Simple, non-recursive)
CREATE POLICY "allow_read_own_profile" ON public.users_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "allow_update_own_profile" ON public.users_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "allow_insert_own_profile" ON public.users_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin access via Security Definer function (Safe)
CREATE POLICY "allow_admin_read_all_profiles" ON public.users_profiles
    FOR SELECT USING (public.is_admin_or_super());


-- 2. User Tenant Memberships
CREATE POLICY "allow_read_own_memberships" ON public.user_tenant_memberships
    FOR SELECT USING (user_id = auth.uid());

-- Admin access via Security Definer function (Safe)
CREATE POLICY "allow_admin_read_tenant_memberships" ON public.user_tenant_memberships
    FOR SELECT USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin'])
    );


-- 3. Tenants
-- Users can see tenants they are members of (checked via membership table)
CREATE POLICY "allow_read_my_tenants" ON public.tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_tenant_memberships
            WHERE user_id = auth.uid() 
            AND tenant_id = public.tenants.id 
            AND is_active = true
        )
    );

-- ============================================
-- VERIFY RPC EXISTS
-- ============================================
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
    SELECT t.id, t.name, t.slug, t.subdomain, t.logo_url, t.subscription_status, t.features
    FROM public.tenants t
    JOIN public.user_tenant_memberships m ON m.tenant_id = t.id
    WHERE m.user_id = auth.uid() AND m.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
