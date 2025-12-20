
-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Variables
DO $$
DECLARE
    v_tenant_id UUID := gen_random_uuid();
    v_user_id UUID := gen_random_uuid();
    v_profile_id UUID := gen_random_uuid();
    v_email TEXT := 'demo@novumflow.com';
    v_password TEXT := 'DemoUser123!';
    v_full_name TEXT := 'Demo Manager';
BEGIN

    -- 3. Create the Demo Tenant
    -- Table: tenants (as confirmed by existence of 'is_active' in codebase types)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tenants') THEN
        INSERT INTO tenants (id, name, slug, is_active, created_at, updated_at)
        VALUES (v_tenant_id, 'Demo Care Home (Sandbox)', 'demo-care-sandbox', true, NOW(), NOW());
    ELSE
        INSERT INTO organizations (id, name, slug, is_active)
        VALUES (v_tenant_id, 'Demo Care Home (Sandbox)', 'demo-care-sandbox', true);
    END IF;

    -- 4. Create the User in auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_password, gen_salt('bf')),
        NOW(),
        NULL,
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('full_name', v_full_name, 'role', 'manager'),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- 5. Create the User Profile
    -- Table: users_profiles
    -- Columns inferred from codebase: id, user_id, email, full_name, role, tenant_id
    INSERT INTO users_profiles (id, user_id, email, full_name, role, tenant_id, is_active, created_at, updated_at)
    VALUES (v_profile_id, v_user_id, v_email, v_full_name, 'manager', v_tenant_id, true, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET tenant_id = v_tenant_id, role = 'manager';

    -- 6. Seed Demo Data (Staff)
    -- Using 'compliance_persons'
    INSERT INTO compliance_persons (
        id, tenant_id, full_name, job_title, department, 
        person_type, current_stage, compliance_status, email
    ) VALUES 
    (gen_random_uuid(), v_tenant_id, 'Sarah Care', 'Senior Carer', 'Care Team', 'EMPLOYEE', 'ONGOING', 'COMPLIANT', 'sarah.demo@example.com'),
    (gen_random_uuid(), v_tenant_id, 'John Nurse', 'Registered Nurse', 'Nursing', 'EMPLOYEE', 'ONGOING', 'PENDING_RENEWAL', 'john.demo@example.com'),
    (gen_random_uuid(), v_tenant_id, 'Emma Admin', 'Administrator', 'Office', 'EMPLOYEE', 'ONBOARDING', 'NON_COMPLIANT', 'emma.demo@example.com');

    -- 7. Seed Demo Data (Clients)
    -- Attempting to seed clients if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'careflow_clients') THEN
        INSERT INTO careflow_clients (id, tenant_id, name, care_level, status)
        VALUES 
        (gen_random_uuid(), v_tenant_id, 'Alice Resident', 'High', 'Active'),
        (gen_random_uuid(), v_tenant_id, 'Bob Patient', 'Medium', 'Active');
    END IF;

    RAISE NOTICE 'Demo User Created Successfully! Login: %', v_email;
END $$;
