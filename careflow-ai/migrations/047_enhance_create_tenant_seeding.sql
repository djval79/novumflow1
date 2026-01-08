-- =================================================================
-- Enhance Create Tenant with Seeding
-- =================================================================
-- Replaces create_tenant to include seeding of:
-- 1. Departments (Care, Operations)
-- 2. Positions (Manager, Care Worker)
-- 3. Default Compliance Settings
-- =================================================================

CREATE OR REPLACE FUNCTION create_tenant(
    p_name TEXT,
    p_subdomain TEXT,
    p_owner_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_tenant_id UUID;
    v_dept_care UUID;
    v_dept_ops UUID;
    v_tenant JSONB;
BEGIN
    -- 1. Create Tenant (with default settings)
    INSERT INTO tenants (
        name, 
        slug, 
        subdomain, 
        subscription_tier, 
        subscription_status,
        features,
        settings
    )
    VALUES (
        p_name, 
        p_subdomain, 
        p_subdomain, 
        'basic', 
        'active',
        '{"careflow_enabled": true, "novumflow_enabled": false, "ai_enabled": true}'::jsonb,
        '{"disabled_features": []}'::jsonb
    )
    RETURNING id INTO v_tenant_id;

    -- 2. Add Owner
    INSERT INTO user_tenant_memberships (user_id, tenant_id, role, is_active)
    VALUES (p_owner_user_id, v_tenant_id, 'owner', true);

    -- 3. Seed Departments
    INSERT INTO departments (tenant_id, name, description)
    VALUES (v_tenant_id, 'Care Services', 'Front-line care delivery')
    RETURNING id INTO v_dept_care;

    INSERT INTO departments (tenant_id, name, description)
    VALUES (v_tenant_id, 'Operations', 'Administrative and support functions')
    RETURNING id INTO v_dept_ops;

    -- 4. Seed Positions
    INSERT INTO positions (tenant_id, title, department_id, description)
    VALUES 
    (v_tenant_id, 'Care Manager', v_dept_care, 'Responsible for care delivery and compliance'),
    (v_tenant_id, 'Care Worker', v_dept_care, 'Delivers direct care to clients'),
    (v_tenant_id, 'Administrator', v_dept_ops, 'System and office administration');

    -- 5. Return Tenant Data
    SELECT row_to_json(t) INTO v_tenant FROM tenants t WHERE id = v_tenant_id;
    
    RETURN v_tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
