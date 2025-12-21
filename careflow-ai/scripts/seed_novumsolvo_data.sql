
-- Seeding script for Novum Solvo Tenant
-- Tenant ID: 57680f2b-881f-4063-abb5-c1791b626852

DO $$
DECLARE
    v_tenant_id UUID := '57680f2b-881f-4063-abb5-c1791b626852';
    v_client_id_1 UUID;
    v_client_id_2 UUID;
    v_staff_id_1 UUID;
    v_staff_id_2 UUID;
BEGIN
    -- 1. Ensure Tenant exists (it should, but safety first)
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = v_tenant_id) THEN
        INSERT INTO tenants (id, name, slug, domain, is_active, subscription_status)
        VALUES (v_tenant_id, 'Novum Solvo Ltd', 'novumsolvo', 'novumsolvo.co.uk', true, 'trial');
    END IF;

    -- 2. Seed Staff
    INSERT INTO careflow_staff (id, tenant_id, full_name, role, status, email)
    VALUES 
        (gen_random_uuid(), v_tenant_id, 'Sarah Jenkins', 'Senior Nurse', 'Active', 'sarah.j@novumsolvo.co.uk'),
        (gen_random_uuid(), v_tenant_id, 'Michael Chen', 'Care Assistant', 'Active', 'm.chen@novumsolvo.co.uk')
    ON CONFLICT (tenant_id, email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO v_staff_id_1; -- This is only for the second row in a multi-insert, wait.

    -- Better to do one by one for RETURNING
    INSERT INTO careflow_staff (tenant_id, full_name, role, status, email)
    VALUES (v_tenant_id, 'Sarah Jenkins', 'Senior Nurse', 'Active', 'sarah.j@novumsolvo.co.uk')
    ON CONFLICT (tenant_id, email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO v_staff_id_1;

    INSERT INTO careflow_staff (tenant_id, full_name, role, status, email)
    VALUES (v_tenant_id, 'Michael Chen', 'Care Assistant', 'Active', 'm.chen@novumsolvo.co.uk')
    ON CONFLICT (tenant_id, email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO v_staff_id_2;

    -- 3. Seed Clients
    INSERT INTO careflow_clients (tenant_id, name, care_level, status, address)
    VALUES (v_tenant_id, 'James Robertson', 'High', 'Active', '12 High Street, Liverpool')
    RETURNING id INTO v_client_id_1;

    INSERT INTO careflow_clients (tenant_id, name, care_level, status, address)
    VALUES (v_tenant_id, 'Alice Thompson', 'Medium', 'Active', '45 Park Lane, Liverpool')
    RETURNING id INTO v_client_id_2;

    -- 4. Seed Visits
    INSERT INTO careflow_visits (tenant_id, client_id, staff_id, scheduled_date, scheduled_start, scheduled_end, visit_type, status)
    VALUES 
        (v_tenant_id, v_client_id_1, v_staff_id_1, CURRENT_DATE, '08:00', '09:00', 'Medication', 'Scheduled'),
        (v_tenant_id, v_client_id_2, v_staff_id_2, CURRENT_DATE, '09:30', '10:30', 'Personal Care', 'Scheduled'),
        (v_tenant_id, v_client_id_1, v_staff_id_2, CURRENT_DATE, '13:00', '14:00', 'Social', 'Scheduled');

    -- 5. Seed Incidents
    INSERT INTO careflow_incidents (tenant_id, date, type, description, severity, status, client_id)
    VALUES 
        (v_tenant_id, NOW() - INTERVAL '1 day', 'Fall', 'Client found on floor in lounge. No injuries.', 'Medium', 'reported', v_client_id_1);

    RAISE NOTICE 'Demo data successfully seeded for Novum Solvo Ltd';
END $$;
