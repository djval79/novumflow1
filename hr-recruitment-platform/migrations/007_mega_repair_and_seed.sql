-- ============================================================================
-- MEGA REPAIR & SEED: CONSOLIDATED BOOTSTRAP (v3)
-- ============================================================================
-- Use this script to fix the "Tenant not found" error and populate everything.
-- This version uses 'active' for job status to pass DB check constraints.

DO $$
DECLARE
    v_tenant_id UUID;
    v_dept_clinical UUID;
    v_pos_carer UUID;
    v_emp_1 UUID;
    v_emp_2 UUID;
    v_conv_id UUID;
    v_job_id UUID;
    v_user_id UUID := '2d0ee2ed-a9f4-4b8d-9a49-461a8032af66';
BEGIN
    -- 1. Create or Find Tenant
    INSERT INTO tenants (name, subdomain, slug, subscription_tier, subscription_status)
    VALUES ('NovumFlow HQ', 'hq', 'hq', 'enterprise', 'active')
    ON CONFLICT (subdomain) DO NOTHING;
    
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'hq' LIMIT 1;

    -- 2. Repair User Profile & Membership
    INSERT INTO users_profiles (user_id, email, full_name, role, is_super_admin, tenant_id)
    VALUES (v_user_id, 'admin@novumflow.app', 'Master Administrator', 'Admin', true, v_tenant_id)
    ON CONFLICT (user_id) DO UPDATE 
    SET is_super_admin = true, role = 'Admin', tenant_id = v_tenant_id;

    INSERT INTO user_tenant_memberships (user_id, tenant_id, role, is_active)
    VALUES (v_user_id, v_tenant_id, 'owner', true)
    ON CONFLICT (user_id, tenant_id) DO NOTHING;

    -- 3. Seed Essential Metadata
    INSERT INTO departments (name, description) VALUES 
    ('Care Services', 'Primary care delivery and nursing'),
    ('Operations', 'General business operations')
    ON CONFLICT (name) DO NOTHING;

    SELECT id INTO v_dept_clinical FROM departments WHERE name = 'Care Services' LIMIT 1;

    INSERT INTO positions (title, department_id, description) VALUES 
    ('Care Worker', v_dept_clinical, 'Frontline care delivery specialist'),
    ('Care Manager', v_dept_clinical, 'Operations and compliance lead')
    ON CONFLICT (title) DO NOTHING;

    SELECT id INTO v_pos_carer FROM positions WHERE title = 'Care Worker' LIMIT 1;

    -- 4. Seed Sample Employees
    -- Sarah Jenkins (Care Manager)
    SELECT id INTO v_emp_1 FROM employees WHERE email = 's.jenkins@example.com' OR employee_number = 'EMP001' LIMIT 1;
    
    IF v_emp_1 IS NULL THEN
        INSERT INTO employees (tenant_id, first_name, last_name, email, role, position, status, date_hired, employee_number)
        VALUES (v_tenant_id, 'Sarah', 'Jenkins', 's.jenkins@example.com', 'Manager', 'Care Manager', 'active', CURRENT_DATE - INTERVAL '2 years', 'EMP001')
        RETURNING id INTO v_emp_1;
    END IF;

    -- David Smith (Care Worker)
    SELECT id INTO v_emp_2 FROM employees WHERE email = 'd.smith@example.com' OR employee_number = 'EMP002' LIMIT 1;

    IF v_emp_2 IS NULL THEN
        INSERT INTO employees (tenant_id, first_name, last_name, email, role, position, status, date_hired, employee_number)
        VALUES (v_tenant_id, 'David', 'Smith', 'd.smith@example.com', 'Staff', 'Care Worker', 'active', CURRENT_DATE - INTERVAL '6 months', 'EMP002')
        RETURNING id INTO v_emp_2;
    END IF;

    -- 5. Seed Attendance & Recruitment
    INSERT INTO attendance_records (employee_id, tenant_id, date, check_in_time, check_out_time, status)
    VALUES (v_emp_2, v_tenant_id, CURRENT_DATE - 1, CURRENT_TIMESTAMP - INTERVAL '1 day 8 hours', CURRENT_TIMESTAMP - INTERVAL '1 day', 'present')
    ON CONFLICT DO NOTHING;

    -- Changed status to 'active' (matches frontend value for 'Published')
    INSERT INTO job_postings (tenant_id, job_title, department, status, employment_type)
    VALUES (v_tenant_id, 'Senior Care Assistant', 'Care Services', 'active', 'full_time')
    ON CONFLICT (job_title, tenant_id) DO NOTHING RETURNING id INTO v_job_id;

    -- 6. Seed Messaging
    INSERT INTO conversations (title, conversation_type, created_by)
    VALUES ('Staff Welcome Hub', 'group', v_emp_1)
    ON CONFLICT DO NOTHING RETURNING id INTO v_conv_id;

    IF v_conv_id IS NOT NULL THEN
        INSERT INTO message_participants (conversation_id, user_id, role_in_conversation)
        VALUES 
        (v_conv_id, v_user_id, 'admin'),
        (v_conv_id, v_emp_1, 'member')
        ON CONFLICT DO NOTHING;

        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES (v_conv_id, v_emp_1, 'System update: Automation engine is now online. Welcome to the team!');
    END IF;

END $$;

SELECT '✅ MEGA REPAIR SUCCESSFUL! Tenant "hq" created and system seeded.' as status;