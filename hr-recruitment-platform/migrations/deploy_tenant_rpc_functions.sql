-- ============================================
-- Deploy Tenant RPC Functions (for both CareFlow and NovumFlow)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS create_tenant(text, text, uuid);
DROP FUNCTION IF EXISTS get_my_tenants();
DROP FUNCTION IF EXISTS set_current_tenant(uuid);

-- ============================================
-- 2. Create Tenant Function
-- Called when a user creates a new organization
-- ============================================
CREATE OR REPLACE FUNCTION create_tenant(
    p_name TEXT,
    p_subdomain TEXT,
    p_owner_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_tenant_id UUID;
    v_tenant JSONB;
BEGIN
    -- Check if subdomain already exists
    IF EXISTS (SELECT 1 FROM tenants WHERE subdomain = p_subdomain OR slug = p_subdomain) THEN
        RAISE EXCEPTION 'Subdomain already exists: %', p_subdomain;
    END IF;

    -- 1. Create Tenant
    INSERT INTO tenants (
        name, 
        slug, 
        subdomain, 
        subscription_tier, 
        subscription_status,
        is_active,
        settings,
        features
    )
    VALUES (
        p_name, 
        p_subdomain, 
        p_subdomain, 
        'trial', 
        'active',
        true,
        '{"theme": "default"}'::jsonb,
        '{"novumflow_enabled": true, "careflow_enabled": true, "ai_enabled": true}'::jsonb
    )
    RETURNING id INTO v_tenant_id;

    -- 2. Add Owner Membership
    INSERT INTO user_tenant_memberships (user_id, tenant_id, role, is_active, permissions)
    VALUES (p_owner_user_id, v_tenant_id, 'owner', true, ARRAY['*']);

    -- 3. Update user profile with tenant association
    UPDATE users_profiles 
    SET tenant_id = v_tenant_id
    WHERE user_id = p_owner_user_id 
      AND tenant_id IS NULL;

    -- 4. Return Tenant Data as JSONB
    SELECT jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'slug', t.slug,
        'subdomain', t.subdomain,
        'subscription_tier', t.subscription_tier,
        'subscription_status', t.subscription_status,
        'settings', t.settings,
        'features', t.features,
        'is_active', t.is_active
    ) INTO v_tenant 
    FROM tenants t 
    WHERE t.id = v_tenant_id;
    
    RETURN v_tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 3. Get My Tenants Function
-- Returns all tenants the current user belongs to
-- ============================================
CREATE OR REPLACE FUNCTION get_my_tenants()
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    subdomain TEXT,
    subscription_tier TEXT,
    subscription_status TEXT,
    settings JSONB,
    features JSONB,
    is_active BOOLEAN,
    user_role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.slug,
        t.subdomain,
        t.subscription_tier::TEXT,
        COALESCE(t.subscription_status::TEXT, 'active'),
        COALESCE(t.settings, '{}'::jsonb),
        COALESCE(t.features, '{"novumflow_enabled": true, "careflow_enabled": true}'::jsonb),
        COALESCE(t.is_active, true),
        m.role::TEXT
    FROM tenants t
    INNER JOIN user_tenant_memberships m ON m.tenant_id = t.id
    WHERE m.user_id = auth.uid()
      AND m.is_active = true
      AND COALESCE(t.is_active, true) = true
    ORDER BY m.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 4. Set Current Tenant Function
-- Sets the tenant context for RLS policies
-- ============================================
CREATE OR REPLACE FUNCTION set_current_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Verify user has access to this tenant
    IF NOT EXISTS (
        SELECT 1 FROM user_tenant_memberships
        WHERE user_id = auth.uid()
          AND tenant_id = p_tenant_id
          AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Access denied to tenant: %', p_tenant_id;
    END IF;

    -- Set the tenant context (can be used by RLS policies)
    PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 5. Ensure table columns exist
-- ============================================
DO $$
BEGIN
    -- Add features column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'features'
    ) THEN
        ALTER TABLE tenants ADD COLUMN features JSONB DEFAULT '{"novumflow_enabled": true, "careflow_enabled": true, "ai_enabled": true}'::jsonb;
    END IF;

    -- Add subscription_status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE tenants ADD COLUMN subscription_status TEXT DEFAULT 'active';
    END IF;

    -- Add settings column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'settings'
    ) THEN
        ALTER TABLE tenants ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add is_active if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE tenants ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add permissions to user_tenant_memberships if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_tenant_memberships' AND column_name = 'permissions'
    ) THEN
        ALTER TABLE user_tenant_memberships ADD COLUMN permissions TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;


-- ============================================
-- 6. Grant execute permissions
-- ============================================
GRANT EXECUTE ON FUNCTION create_tenant(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_tenants() TO authenticated;
GRANT EXECUTE ON FUNCTION set_current_tenant(uuid) TO authenticated;


-- ============================================
-- 7. Verification
-- ============================================
SELECT 'RPC Functions deployed successfully!' as status;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_tenant', 'get_my_tenants', 'set_current_tenant');
