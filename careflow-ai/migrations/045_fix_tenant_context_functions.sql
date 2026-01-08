-- =================================================================
-- Fix Tenant Context Functions (set_current_tenant & user_has_tenant_access)
-- =================================================================
-- This migration ensures that:
-- 1. set_current_tenant correctly handles Super Admins and validates membership.
-- 2. user_has_tenant_access correctly enforces isolation based on the set context.
-- =================================================================

-- 1. FIX: set_current_tenant
-- Must match existing parameter name 'p_tenant_id' to avoid dropping usage
CREATE OR REPLACE FUNCTION public.set_current_tenant(p_tenant_id UUID)
RETURNS void AS $$
DECLARE
    v_exists BOOLEAN;
    v_is_super_admin BOOLEAN;
BEGIN
    -- Check if user is super admin
    SELECT is_super_admin INTO v_is_super_admin
    FROM public.users_profiles
    WHERE user_id = auth.uid();

    -- If Super Admin, allow ANY tenant context
    IF v_is_super_admin THEN
        PERFORM set_config('app.current_tenant', p_tenant_id::TEXT, false);
        RETURN;
    END IF;

    -- Standard User: Check active membership
    SELECT EXISTS (
        SELECT 1
        FROM public.user_tenant_memberships
        WHERE user_id = auth.uid()
        AND tenant_id = p_tenant_id
        AND is_active = true
    ) INTO v_exists;

    IF v_exists THEN
        PERFORM set_config('app.current_tenant', p_tenant_id::TEXT, false);
    ELSE
        -- Specific error for debugging
        RAISE EXCEPTION 'User % does not have access to tenant %', auth.uid(), p_tenant_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. FIX: user_has_tenant_access
-- Must match existing parameter name 'p_tenant_id' to avoid dropping dependency usage
CREATE OR REPLACE FUNCTION public.user_has_tenant_access(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_tenant TEXT;
BEGIN
    -- Get the tenant ID from the session variable set by set_current_tenant
    v_current_tenant := current_setting('app.current_tenant', true);
    
    -- Safety: If no tenant context is set, DENY ACCESS.
    -- This prevents data leakage if the frontend forgets to call set_current_tenant.
    IF v_current_tenant IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Compare row's tenant_id with context
    RETURN v_current_tenant::UUID = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
