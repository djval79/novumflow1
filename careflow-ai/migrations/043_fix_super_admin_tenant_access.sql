-- =================================================================
-- Fix: Super Admin "God Mode" for Tenant Access
-- =================================================================
-- This migration updates the get_my_tenants() function to allow
-- Super Admins to see ALL tenants, bypassing the membership check.
-- =================================================================

-- Drop the function first to allow return type changes
DROP FUNCTION IF EXISTS public.get_my_tenants();

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
DECLARE
    v_is_super_admin BOOLEAN;
BEGIN
    -- Check if user is super admin
    SELECT is_super_admin INTO v_is_super_admin
    FROM public.users_profiles
    WHERE user_id = auth.uid();

    IF v_is_super_admin THEN
        -- GOD MODE: Return ALL tenants for super admin
        RETURN QUERY
        SELECT t.id, t.name, t.slug, t.subdomain, t.logo_url, t.subscription_status::TEXT, t.features
        FROM public.tenants t;
    ELSE
        -- STANDARD MODE: Return only tenants where user has an active membership
        RETURN QUERY
        SELECT t.id, t.name, t.slug, t.subdomain, t.logo_url, t.subscription_status::TEXT, t.features
        FROM public.tenants t
        JOIN public.user_tenant_memberships m ON m.tenant_id = t.id
        WHERE m.user_id = auth.uid() AND m.is_active = true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
