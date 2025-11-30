-- ============================================
-- FINAL FIX FOR ALL LOADING LOOPS & RLS ISSUES
-- ============================================

-- 1. DROP EVERYTHING THAT MIGHT BE CAUSING ISSUES
-- We drop policies to ensure we start clean.

-- Users Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users_profiles;

-- Tenants & Memberships
DROP POLICY IF EXISTS "Users can view their tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view their memberships" ON public.user_tenant_memberships;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.user_tenant_memberships;
DROP POLICY IF EXISTS "Admins can view tenant memberships" ON public.user_tenant_memberships;

-- Medications & CareFlow
DROP POLICY IF EXISTS "Users can access medications in their tenant" ON public.medications;
DROP POLICY IF EXISTS "Users can access mar records in their tenant" ON public.medication_records;
DROP POLICY IF EXISTS "Users can access clients in their tenant" ON public.clients;

-- ============================================
-- 2. CREATE SECURITY DEFINER FUNCTIONS (The "Magic Key")
-- These functions bypass RLS to safely check permissions.
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR is_super_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- 3. RE-CREATE POLICIES (Non-Recursive)
-- ============================================

-- Users Profiles
CREATE POLICY "Users can view their own profile" ON public.users_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.users_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.users_profiles
    FOR SELECT USING (public.is_admin_or_super());

CREATE POLICY "Users can insert their own profile" ON public.users_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Tenant Memberships
CREATE POLICY "Users can view own memberships" ON public.user_tenant_memberships
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view tenant memberships" ON public.user_tenant_memberships
    FOR SELECT USING (
        public.has_tenant_role(tenant_id, ARRAY['owner', 'admin'])
    );

-- Tenants
CREATE POLICY "Users can view their tenants" ON public.tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_tenant_memberships
            WHERE user_id = auth.uid() 
            AND tenant_id = public.tenants.id 
            AND is_active = true
        )
    );

-- Medications & CareFlow (Using Safe Function)
CREATE POLICY "Users can access medications in their tenant" ON public.medications
    FOR ALL USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer']));

CREATE POLICY "Users can access mar records in their tenant" ON public.medication_records
    FOR ALL USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer']));

CREATE POLICY "Users can access clients in their tenant" ON public.clients
    FOR ALL USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'member', 'carer']));

-- ============================================
-- 4. RPC FOR SAFE LOADING (Bypass RLS completely for loading)
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

-- ============================================
-- 5. ENSURE PROFILE EXISTS
-- ============================================

-- Drop constraint if it exists (fix for previous error)
ALTER TABLE public.users_profiles DROP CONSTRAINT IF EXISTS users_profiles_role_check;

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
