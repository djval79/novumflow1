-- ============================================================================
-- FULL PLATFORM SEED: REAL-WORLD SAMPLE DATA
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_dept_ops UUID;
    v_dept_clinical UUID;
    v_pos_carer UUID;
    v_pos_manager UUID;
    v_emp_1 UUID;
    v_emp_2 UUID;
    v_conv_id UUID;
    v_job_id UUID;
BEGIN
    -- 1. Get the Tenant ID (Created in bootstrap)
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'hq' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant "hq" not found. Please run the bootstrap script (005_platform_bootstrap.sql) first.';
    END IF;

    -- 2. Get Department and Position IDs
    SELECT id INTO v_dept_ops FROM departments WHERE name = 'Operations' LIMIT 1;
    SELECT id INTO v_dept_clinical FROM departments WHERE name = 'Care Services' LIMIT 1;
    SELECT id INTO v_pos_carer FROM positions WHERE title = 'Care Worker' LIMIT 1;
    -- Note: 'Care Worker' title was in fix_remaining_missing_tables.sql
    IF v_pos_carer IS NULL THEN
        SELECT id INTO v_pos_carer FROM positions LIMIT 1;
    END IF;
    SELECT id INTO v_pos_manager FROM positions WHERE title = 'Care Manager' LIMIT 1;

    -- 3. Seed Sample Employees
    -- Employee 1: Sarah Jenkins (Care Manager)
    INSERT INTO employees (
        tenant_id, first_name, last_name, email, phone, role, job_title, department, 
        status, start_date, employee_number
    ) VALUES (
        v_tenant_id, 'Sarah', 'Jenkins', 's.jenkins@example.com', '07700900123', 'Manager', 
        'Care Manager', 'Care Services', 'active', CURRENT_DATE - INTERVAL '2 years', 'EMP001'
    ) ON CONFLICT (email) DO NOTHING RETURNING id INTO v_emp_1;

    -- Employee 2: David Smith (Care Worker)
    INSERT INTO employees (
        tenant_id, first_name, last_name, email, phone, role, job_title, department, 
        status, start_date, employee_number
    ) VALUES (
        v_tenant_id, 'David', 'Smith', 'd.smith@example.com', '07700900124', 'Staff', 
        'Care Worker', 'Care Services', 'active', CURRENT_DATE - INTERVAL '6 months', 'EMP002'
    ) ON CONFLICT (email) DO NOTHING RETURNING id INTO v_emp_2;

    -- 4. Seed Attendance Records (Last 3 days)
    INSERT INTO attendance_records (employee_id, tenant_id, punch_in_time, punch_out_time, status, type)
    VALUES 
    (v_emp_2, v_tenant_id, CURRENT_TIMESTAMP - INTERVAL '2 days 10 hours', CURRENT_TIMESTAMP - INTERVAL '2 days 2 hours', 'regular', 'fixed'),
    (v_emp_2, v_tenant_id, CURRENT_TIMESTAMP - INTERVAL '1 day 10 hours', CURRENT_TIMESTAMP - INTERVAL '1 day 2 hours', 'regular', 'fixed');

    -- 5. Seed Leave Request
    INSERT INTO leave_requests (employee_id, tenant_id, leave_type, start_date, end_date, reason, status)
    VALUES (
        v_emp_2, v_tenant_id, 'Annual Leave', CURRENT_DATE + INTERVAL '10 days', 
        CURRENT_DATE + INTERVAL '14 days', 'Family holiday', 'pending'
    ) ON CONFLICT DO NOTHING;

    -- 6. Seed Recruitment: Job Posting
    INSERT INTO job_postings (tenant_id, job_title, department_id, employment_type, location, salary_range, description, status)
    VALUES (
        v_tenant_id, 'Senior Care Assistant', v_dept_clinical, 'Full-time', 'Ringstead', 
        '£24,000 - £28,000', 'We are looking for an experienced Senior Care Assistant to lead our night shift team...', 'published'
    ) ON CONFLICT DO NOTHING RETURNING id INTO v_job_id;

    -- 7. Seed Recruitment: Application
    INSERT INTO applications (tenant_id, job_posting_id, applicant_first_name, applicant_last_name, applicant_email, status, ai_score)
    VALUES (
        v_tenant_id, v_job_id, 'Emily', 'Brown', 'e.brown@gmail.com', 'New', 85
    ) ON CONFLICT DO NOTHING;

    -- 8. Seed Messaging: Initial Conversation
    INSERT INTO conversations (title, conversation_type, created_by)
    VALUES ('Team Announcements', 'group', v_emp_1)
    RETURNING id INTO v_conv_id;

    INSERT INTO message_participants (conversation_id, user_id, role_in_conversation)
    VALUES 
    (v_conv_id, '2d0ee2ed-a9f4-4b8d-9a49-461a8032af66', 'admin'),
    (v_conv_id, v_emp_1, 'member');

    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (v_conv_id, v_emp_1, 'Welcome everyone to the new NovumFlow messaging hub! Please acknowledge this message.');

END $$;

SELECT '✅ Real-world sample data seeded successfully!' as status;
