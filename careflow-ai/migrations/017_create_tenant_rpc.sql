-- ============================================
-- Phase 3: Create Tenant RPC
-- ============================================

-- Function to create a tenant and assign the creator as owner
DROP FUNCTION IF EXISTS create_tenant(text, text, uuid);

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
    -- 1. Create Tenant
    INSERT INTO tenants (name, slug, subdomain, subscription_tier)
    VALUES (p_name, p_subdomain, p_subdomain, 'basic')
    RETURNING id INTO v_tenant_id;

    -- 2. Add Owner
    INSERT INTO user_tenant_memberships (user_id, tenant_id, role, is_active)
    VALUES (p_owner_user_id, v_tenant_id, 'owner', true);

    -- 3. Return Tenant Data
    SELECT row_to_json(t) INTO v_tenant FROM tenants t WHERE id = v_tenant_id;
    
    RETURN v_tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
