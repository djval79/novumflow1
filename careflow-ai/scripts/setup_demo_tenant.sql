-- ============================================
-- COMPREHENSIVE DEMO TENANT SETUP
-- Complete data for presentations & demos
-- ============================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_admin_user_id UUID;
    v_staff_ids UUID[] := ARRAY[]::UUID[];
    v_client_ids UUID[] := ARRAY[]::UUID[];
    v_temp_id UUID;
BEGIN
    -- ==========================================
    -- 1. CREATE OR GET DEMO TENANT
    -- ==========================================
    SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'mecare-demo' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        v_tenant_id := gen_random_uuid();
        INSERT INTO tenants (id, name, slug, domain, is_active, subscription_status, subscription_tier, features)
        VALUES (
            v_tenant_id, 
            'MeCare Health Services',
            'mecare-demo',
            'mecare-demo.careflow.ai',
            true,
            'active',
            'professional',
            '{"careflow_enabled": true, "novumflow_enabled": true, "ai_enabled": true}'::jsonb
        );
        RAISE NOTICE 'Created new demo tenant: %', v_tenant_id;
    ELSE
        RAISE NOTICE 'Using existing demo tenant: %', v_tenant_id;
    END IF;

    -- ==========================================
    -- 2. LINK ADMIN USER TO DEMO TENANT
    -- ==========================================
    SELECT id INTO v_admin_user_id FROM auth.users WHERE email = 'mrsonirie@gmail.com' LIMIT 1;
    
    IF v_admin_user_id IS NOT NULL THEN
        INSERT INTO user_tenant_memberships (user_id, tenant_id, role, is_active)
        VALUES (v_admin_user_id, v_tenant_id, 'owner', true)
        ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'owner', is_active = true;
        RAISE NOTICE 'Admin linked to tenant';
    END IF;

    -- ==========================================
    -- 3. CREATE STAFF MEMBERS (8 staff)
    -- ==========================================
    INSERT INTO careflow_staff (tenant_id, full_name, role, status, email, phone, department, start_date, skills)
    VALUES 
        (v_tenant_id, 'Sarah Jenkins', 'Senior Nurse', 'Active', 'sarah.jenkins@mecare.co.uk', '07700 900001', 'Clinical', CURRENT_DATE - INTERVAL '2 years', ARRAY['Medication Administration', 'Wound Care', 'Dementia Care']),
        (v_tenant_id, 'Michael Chen', 'Care Team Lead', 'Active', 'michael.chen@mecare.co.uk', '07700 900002', 'Operations', CURRENT_DATE - INTERVAL '3 years', ARRAY['Leadership', 'First Aid', 'Moving and Handling']),
        (v_tenant_id, 'Emma Williams', 'Care Assistant', 'Active', 'emma.williams@mecare.co.uk', '07700 900003', 'Field Care', CURRENT_DATE - INTERVAL '1 year', ARRAY['Personal Care', 'Companionship']),
        (v_tenant_id, 'James Thompson', 'Registered Nurse', 'Active', 'james.thompson@mecare.co.uk', '07700 900004', 'Clinical', CURRENT_DATE - INTERVAL '18 months', ARRAY['Clinical Assessment', 'Care Planning', 'IV Therapy']),
        (v_tenant_id, 'Priya Patel', 'Senior Care Assistant', 'Active', 'priya.patel@mecare.co.uk', '07700 900005', 'Field Care', CURRENT_DATE - INTERVAL '4 years', ARRAY['End of Life Care', 'Mental Health', 'Learning Disabilities']),
        (v_tenant_id, 'David O''Connor', 'Night Care Worker', 'Active', 'david.oconnor@mecare.co.uk', '07700 900006', 'Night Team', CURRENT_DATE - INTERVAL '6 months', ARRAY['Night Care', 'Sleep-in Duties']),
        (v_tenant_id, 'Lisa Ahmed', 'Care Coordinator', 'Active', 'lisa.ahmed@mecare.co.uk', '07700 900007', 'Administration', CURRENT_DATE - INTERVAL '5 years', ARRAY['Scheduling', 'Client Relations', 'Compliance']),
        (v_tenant_id, 'Robert Hughes', 'Care Assistant', 'On Leave', 'robert.hughes@mecare.co.uk', '07700 900008', 'Field Care', CURRENT_DATE - INTERVAL '8 months', ARRAY['Personal Care', 'Domestic Support'])
    ON CONFLICT (tenant_id, email) DO UPDATE SET full_name = EXCLUDED.full_name;
    
    -- Get staff IDs for later use
    SELECT ARRAY_AGG(id) INTO v_staff_ids FROM careflow_staff WHERE tenant_id = v_tenant_id LIMIT 8;
    RAISE NOTICE 'Created 8 staff members';

    -- ==========================================
    -- 4. CREATE CLIENTS (12 clients)
    -- ==========================================
    INSERT INTO careflow_clients (tenant_id, name, date_of_birth, care_level, status, address, postcode, phone, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, funding_source, medical_conditions, allergies)
    VALUES 
        (v_tenant_id, 'Margaret Thompson', '1938-03-15', 'High', 'Active', '12 Willow Lane', 'L15 4AB', '0151 555 0001', 'John Thompson', '07700 800001', 'Son', 'Council', ARRAY['Dementia', 'Type 2 Diabetes'], ARRAY['Penicillin']),
        (v_tenant_id, 'George Wilson', '1942-07-22', 'Medium', 'Active', '45 Oak Street', 'L16 2CD', '0151 555 0002', 'Mary Wilson', '07700 800002', 'Wife', 'Private', ARRAY['Parkinson''s Disease'], ARRAY[]::TEXT[]),
        (v_tenant_id, 'Dorothy Evans', '1935-11-08', 'High', 'Active', '78 Cherry Road', 'L17 3EF', '0151 555 0003', 'Susan Evans', '07700 800003', 'Daughter', 'NHS', ARRAY['COPD', 'Heart Failure'], ARRAY['Latex']),
        (v_tenant_id, 'Harold Brown', '1940-05-30', 'Critical', 'Active', '23 Maple Avenue', 'L18 4GH', '0151 555 0004', 'Alice Brown', '07700 800004', 'Wife', 'Mixed', ARRAY['End Stage Renal Disease', 'Diabetes'], ARRAY['Codeine', 'Shellfish']),
        (v_tenant_id, 'Edith Clarke', '1943-09-12', 'Low', 'Active', '56 Birch Close', 'L19 5IJ', '0151 555 0005', 'Peter Clarke', '07700 800005', 'Son', 'Private', ARRAY['Mild Arthritis'], ARRAY[]::TEXT[]),
        (v_tenant_id, 'Arthur Roberts', '1937-02-18', 'Medium', 'Active', '89 Pine Gardens', 'L20 6KL', '0151 555 0006', 'Janet Roberts', '07700 800006', 'Daughter', 'Council', ARRAY['Stroke Recovery', 'Hypertension'], ARRAY['Aspirin']),
        (v_tenant_id, 'Elsie Taylor', '1930-12-25', 'High', 'Active', '34 Elm Close', 'L21 7MN', '0151 555 0007', 'David Taylor', '07700 800007', 'Son', 'NHS', ARRAY['Advanced Dementia', 'Falls Risk'], ARRAY[]::TEXT[]),
        (v_tenant_id, 'Frederick Moore', '1944-06-03', 'Medium', 'Active', '67 Ash Lane', 'L22 8OP', '0151 555 0008', 'Patricia Moore', '07700 800008', 'Wife', 'Private', ARRAY['Mobility Issues', 'Depression'], ARRAY['Sulfa Drugs']),
        (v_tenant_id, 'Olive Walker', '1939-08-20', 'High', 'Active', '90 Beech Road', 'L23 9QR', '0151 555 0009', 'Richard Walker', '07700 800009', 'Nephew', 'Council', ARRAY['Multiple Sclerosis'], ARRAY['Nuts']),
        (v_tenant_id, 'Stanley Green', '1936-04-17', 'Low', 'Active', '13 Cedar Way', 'L24 0ST', '0151 555 0010', 'Barbara Green', '07700 800010', 'Wife', 'Private', ARRAY['Mild Cognitive Impairment'], ARRAY[]::TEXT[]),
        (v_tenant_id, 'Vera King', '1941-10-28', 'Medium', 'Active', '46 Sycamore Street', 'L25 1UV', '0151 555 0011', 'Michael King', '07700 800011', 'Son', 'Mixed', ARRAY['Osteoporosis', 'Anxiety'], ARRAY['Ibuprofen']),
        (v_tenant_id, 'Norman Wright', '1933-01-05', 'Critical', 'Active', '79 Hawthorn Drive', 'L26 2WX', '0151 555 0012', 'Helen Wright', '07700 800012', 'Daughter', 'NHS', ARRAY['Terminal Cancer', 'Palliative Care'], ARRAY['Morphine'])
    ON CONFLICT DO NOTHING;
    
    SELECT ARRAY_AGG(id) INTO v_client_ids FROM careflow_clients WHERE tenant_id = v_tenant_id LIMIT 12;
    RAISE NOTICE 'Created 12 clients';

    -- ==========================================
    -- 5. CREATE TODAY'S VISITS (15 visits)
    -- ==========================================
    INSERT INTO careflow_visits (tenant_id, client_id, staff_id, scheduled_date, scheduled_start, scheduled_end, visit_type, status, notes)
    SELECT 
        v_tenant_id,
        v_client_ids[1 + (row_number() OVER () % array_length(v_client_ids, 1))],
        v_staff_ids[1 + (row_number() OVER () % array_length(v_staff_ids, 1))],
        CURRENT_DATE,
        (ARRAY['07:00', '08:30', '09:00', '10:30', '11:00', '12:30', '13:00', '14:30', '15:00', '16:30', '17:00', '18:30', '19:00', '20:30', '21:00'])[gs],
        (ARRAY['08:00', '09:30', '10:00', '11:30', '12:00', '13:30', '14:00', '15:30', '16:00', '17:30', '18:00', '19:30', '20:00', '21:30', '22:00'])[gs],
        (ARRAY['Personal Care', 'Medication', 'Companionship', 'Meal Prep', 'Medical', 'Personal Care', 'Medication', 'Companionship', 'Personal Care', 'Meal Prep', 'Evening Check', 'Medication', 'Personal Care', 'Night Check', 'Sleep-in'])[gs],
        CASE 
            WHEN gs <= 4 THEN 'Completed'
            WHEN gs <= 7 THEN 'In Progress'
            ELSE 'Scheduled'
        END,
        'Regular scheduled visit'
    FROM generate_series(1, 15) gs;
    RAISE NOTICE 'Created 15 visits for today';

    -- ==========================================
    -- 6. CREATE RECENT INCIDENTS (5 incidents)
    -- ==========================================
    INSERT INTO careflow_incidents (tenant_id, client_id, incident_date, incident_type, description, severity, status, reported_by, location)
    VALUES 
        (v_tenant_id, v_client_ids[1], NOW() - INTERVAL '2 days', 'Fall', 'Client found on floor in bedroom. Minor bruising to left arm. No head injury. GP notified.', 'medium', 'resolved', v_admin_user_id, 'Bedroom'),
        (v_tenant_id, v_client_ids[3], NOW() - INTERVAL '5 days', 'Medication Error', 'Morning medication given 30 minutes late due to traffic delay. No adverse effects.', 'low', 'closed', v_admin_user_id, 'Kitchen'),
        (v_tenant_id, v_client_ids[4], NOW() - INTERVAL '1 day', 'Safeguarding', 'Financial concern raised by family member. Referred to safeguarding team.', 'high', 'under_investigation', v_admin_user_id, 'N/A'),
        (v_tenant_id, v_client_ids[7], NOW() - INTERVAL '3 days', 'Near Miss', 'Almost slipped on wet bathroom floor. Non-slip mats now installed.', 'low', 'resolved', v_admin_user_id, 'Bathroom'),
        (v_tenant_id, v_client_ids[12], NOW(), 'Medical Emergency', 'Client experiencing chest pain. 999 called. Admitted to hospital.', 'critical', 'reported', v_admin_user_id, 'Living Room')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Created 5 incidents';

    -- ==========================================
    -- 7. CREATE TRAINING MODULES (6 modules)
    -- ==========================================
    INSERT INTO careflow_training_modules (tenant_id, title, description, category, duration_minutes, is_mandatory, certification_valid_months, pass_score)
    VALUES 
        (v_tenant_id, 'Safeguarding Adults Level 2', 'Essential safeguarding awareness and reporting procedures', 'safeguarding', 120, true, 12, 80),
        (v_tenant_id, 'Medication Administration', 'Safe handling and administration of medications', 'clinical', 90, true, 24, 85),
        (v_tenant_id, 'Moving and Handling', 'Safe techniques for moving and positioning clients', 'health_safety', 180, true, 12, 80),
        (v_tenant_id, 'Dementia Awareness', 'Understanding and caring for people with dementia', 'specialist', 60, false, 24, 75),
        (v_tenant_id, 'First Aid at Work', 'Emergency first aid procedures', 'health_safety', 360, true, 36, 80),
        (v_tenant_id, 'GDPR & Data Protection', 'Understanding data protection in care settings', 'compliance', 45, true, 12, 80)
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Created 6 training modules';

    -- ==========================================
    -- 8. CREATE ENQUIRIES (CRM) (4 leads)
    -- ==========================================
    INSERT INTO careflow_enquiries (tenant_id, contact_name, contact_email, contact_phone, relationship, client_name, care_needs, area_postcode, funding_type, urgency, source, status, estimated_hours_per_week, next_follow_up)
    VALUES 
        (v_tenant_id, 'John Smith', 'john.smith@email.com', '07700 900100', 'Son', 'Mary Smith', 'Personal care and medication support for elderly mother with dementia', 'L15 4XX', 'private', 'normal', 'website', 'assessment_booked', 21, CURRENT_DATE + INTERVAL '2 days'),
        (v_tenant_id, 'Dr. Helen Brooks', 'h.brooks@nhs.net', '0151 555 9999', 'GP', 'Bernard Lewis', 'Hospital discharge - requires 4x daily visits for wound care', 'L18 7YY', 'nhs', 'urgent', 'referral', 'quoted', 14, CURRENT_DATE + INTERVAL '1 day'),
        (v_tenant_id, 'Sarah Connor', 'sconnor@outlook.com', '07700 900200', 'self', 'Sarah Connor', 'Looking for companionship visits for my husband while I work', 'L22 3ZZ', 'private', 'normal', 'phone', 'contacted', 10, CURRENT_DATE + INTERVAL '5 days'),
        (v_tenant_id, 'Liverpool Council Adult Services', 'referrals@liverpool.gov.uk', '0151 233 3000', 'social_worker', 'Agnes Mitchell', 'Urgent reablement package following fall and hospital stay', 'L25 8AA', 'council', 'immediate', 'referral', 'new', 28, CURRENT_DATE)
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Created 4 CRM enquiries';

    -- ==========================================
    -- 9. CREATE LEAVE REQUESTS (3 requests)
    -- ==========================================
    INSERT INTO careflow_leave_requests (tenant_id, staff_id, leave_type, start_date, end_date, days_requested, reason, status)
    VALUES 
        (v_tenant_id, v_staff_ids[3], 'holiday', CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '21 days', 5, 'Family holiday', 'approved'),
        (v_tenant_id, v_staff_ids[5], 'sick', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE, 3, 'Flu', 'approved'),
        (v_tenant_id, v_staff_ids[6], 'holiday', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '37 days', 5, 'Christmas break', 'pending')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Created 3 leave requests';

    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DEMO TENANT SETUP COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Tenant ID: %', v_tenant_id;
    RAISE NOTICE 'Tenant Name: MeCare Health Services';
    RAISE NOTICE 'Staff: 8 members';
    RAISE NOTICE 'Clients: 12 service users';
    RAISE NOTICE 'Today''s Visits: 15 scheduled';
    RAISE NOTICE 'Incidents: 5 (various statuses)';
    RAISE NOTICE 'Training Modules: 6';
    RAISE NOTICE 'CRM Leads: 4';
    RAISE NOTICE '';
    RAISE NOTICE 'Login with: mrsonirie@gmail.com';
    RAISE NOTICE '============================================';
END $$;
