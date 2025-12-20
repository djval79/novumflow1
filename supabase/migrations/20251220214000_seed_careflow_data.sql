-- Seed CareFlow specific data for the demo tenant
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the demo tenant ID (using the slug defined in create_demo_user.sql or standard 'demo')
    SELECT id INTO v_tenant_id FROM tenants WHERE slug IN ('demo', 'demo-care-sandbox') LIMIT 1;
    
    IF v_tenant_id IS NOT NULL THEN
        -- 1. Seed tenant_integrations for CareFlow
        INSERT INTO tenant_integrations (tenant_id, service_name, display_name, category, is_active, is_connected)
        VALUES 
            (v_tenant_id, 'xero', 'Xero Accounting', 'Finance', true, true),
            (v_tenant_id, 'slack', 'Slack Notifications', 'Communication', true, true),
            (v_tenant_id, 'nhs_spine', 'NHS Spine Registry', 'Medical', true, false),
            (v_tenant_id, 'gp_connect', 'GP Connect Protocol', 'Medical', true, true)
        ON CONFLICT (tenant_id, service_name) DO NOTHING;

        -- 2. Seed samples for careflow_staff (using full_name as expected by supabaseService.ts)
        INSERT INTO careflow_staff (tenant_id, full_name, role, status, email)
        VALUES 
            (v_tenant_id, 'Sarah Jenkins', 'Senior Nurse', 'active', 'sarah.j@careflow.ai'),
            (v_tenant_id, 'Michael Chen', 'Care Assistant', 'active', 'm.chen@careflow.ai'),
            (v_tenant_id, 'Emma Wilson', 'Support Worker', 'on_leave', 'e.wilson@careflow.ai')
        ON CONFLICT DO NOTHING;

        -- 3. Seed samples for careflow_clients (using name as expected by supabaseService.ts)
        INSERT INTO careflow_clients (tenant_id, name, status, address)
        VALUES 
            (v_tenant_id, 'James Robertson', 'active', '12 High Street, Liverpool'),
            (v_tenant_id, 'Alice Thompson', 'active', '45 Park Lane, Liverpool'),
            (v_tenant_id, 'Robert Miller', 'pending', '78 Oak Road, Liverpool')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
