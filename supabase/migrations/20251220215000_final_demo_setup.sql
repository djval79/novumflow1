-- Final Stabilization and Test Data Script
-- Manual insert with membership link to avoid non-unique RPC issues

DO $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
BEGIN
    -- 1. Get the demo user
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'demo@novumflow.com' LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- 2. Create the tenant if not exists
        SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'demo-test' LIMIT 1;
        
        IF v_tenant_id IS NULL THEN
            v_tenant_id := gen_random_uuid();
            INSERT INTO tenants (id, name, slug, domain, is_active, subscription_tier)
            VALUES (v_tenant_id, 'Novum Analytics (Demo)', 'demo-test', 'demo-test', true, 'trial');
        END IF;

        -- 3. Link user to tenant (The CRITICAL part for initialization)
        INSERT INTO user_tenant_memberships (user_id, tenant_id, role, is_active)
        VALUES (v_user_id, v_tenant_id, 'admin', true)
        ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'admin', is_active = true;

        -- 4. Update profile
        UPDATE users_profiles 
        SET tenant_id = v_tenant_id, role = 'admin'
        WHERE user_id = v_user_id;

        -- 5. Seed CareFlow data
        INSERT INTO careflow_staff (tenant_id, full_name, role, status, email)
        VALUES 
            (v_tenant_id, 'Sarah Jenkins', 'Senior Nurse', 'active', 'sarah.j@careflow.ai'),
            (v_tenant_id, 'Michael Chen', 'Care Assistant', 'active', 'm.chen@careflow.ai')
        ON CONFLICT DO NOTHING;

        INSERT INTO careflow_clients (tenant_id, name, status, address)
        VALUES 
            (v_tenant_id, 'James Robertson', 'active', '12 High Street, Liverpool'),
            (v_tenant_id, 'Alice Thompson', 'active', '45 Park Lane, Liverpool')
        ON CONFLICT DO NOTHING;

        INSERT INTO tenant_integrations (tenant_id, service_name, display_name, category, is_active, is_connected)
        VALUES 
            (v_tenant_id, 'xero', 'Xero Accounting', 'Finance', true, true),
            (v_tenant_id, 'slack', 'Slack Notifications', 'Communication', true, true),
            (v_tenant_id, 'gp_connect', 'GP Connect Protocol', 'Medical', true, true)
        ON CONFLICT (tenant_id, service_name) DO NOTHING;
        
        RAISE NOTICE 'CareFlow Demo Environment Stabilized for user: %', v_user_id;
    END IF;
END $$;
