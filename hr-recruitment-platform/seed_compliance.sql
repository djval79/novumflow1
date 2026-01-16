-- Compliance Test Data Seed Script (Multi-Tenant)
-- Populates compliance dashboards across common demo tenants

DO $$
DECLARE
    v_t_id uuid;
    v_u_id uuid;
    v_person_id uuid;
    v_tenant_record RECORD;
BEGIN
    RAISE NOTICE 'Starting multi-tenant compliance seeding...';

    -- Loop through primary demo tenants
    FOR v_tenant_record IN 
        SELECT id, name FROM tenants 
        WHERE name IN ('MeCare Health Services', 'mecare', 'Novum Analytics (Demo)', 'Caring Hands')
    LOOP
        v_t_id := v_tenant_record.id;
        RAISE NOTICE 'Seeding for tenant: % (%)', v_tenant_record.name, v_t_id;

        -- Get an admin user for this tenant if possible, else pick first user
        SELECT user_id INTO v_u_id FROM users_profiles WHERE tenant_id = v_t_id LIMIT 1;
        IF v_u_id IS NULL THEN
            SELECT id INTO v_u_id FROM auth.users LIMIT 1;
        END IF;

        -- 1. Sponsored Workers
        INSERT INTO sponsored_workers (tenant_id, first_name, last_name, email, nationality, visa_type, visa_number, visa_start_date, visa_expiry_date, cos_number, sponsorship_status, job_title, department)
        SELECT v_t_id, 'Maria', 'Santos', 'maria.santos.' || v_t_id || '@example.com', 'Brazil', 'Health and Care Worker', 'VIS-' || substr(v_t_id::text, 1, 8), 
               CURRENT_DATE - INTERVAL '2 years', CURRENT_DATE + INTERVAL '14 days', 
               'COS-' || substr(v_t_id::text, 1, 8), 'active', 'Senior Care Assistant', 'Care'
        WHERE NOT EXISTS (SELECT 1 FROM sponsored_workers WHERE tenant_id = v_t_id AND first_name = 'Maria' AND last_name = 'Santos');

        -- 2. Compliance Alerts
        INSERT INTO sponsor_compliance_alerts (tenant_id, worker_id, alert_type, severity, title, description, due_date, status)
        SELECT v_t_id, 
               (SELECT id FROM sponsored_workers WHERE tenant_id = v_t_id AND first_name = 'Maria' LIMIT 1),
               'visa_expiry', 'critical', 
               'Maria Santos visa expires in 14 days',
               'Immediate action required. Visa expires on ' || (CURRENT_DATE + INTERVAL '14 days')::text,
               CURRENT_DATE + INTERVAL '14 days', 'active'
        WHERE NOT EXISTS (SELECT 1 FROM sponsor_compliance_alerts WHERE tenant_id = v_t_id AND title LIKE '%Maria Santos%');

        -- 3. DBS Checks
        INSERT INTO dbs_checks (tenant_id, user_id, applicant_name, applicant_email, certificate_number, check_type, issue_date, expiry_date, status)
        SELECT v_t_id, v_u_id, 'Sarah Jenkins', 's.jenkins.' || v_t_id || '@example.com', 'DBS-' || substr(v_t_id::text, 1, 8), 'enhanced_barred', 
               CURRENT_DATE - INTERVAL '3 years', CURRENT_DATE + INTERVAL '14 days', 'clear'
        WHERE NOT EXISTS (SELECT 1 FROM dbs_checks WHERE tenant_id = v_t_id AND applicant_name = 'Sarah Jenkins');

        -- 4. Right to Work
        INSERT INTO right_to_work_checks (tenant_id, user_id, staff_name, document_type, check_date, status)
        SELECT v_t_id, v_u_id, 'Sarah Jenkins', 'share_code', CURRENT_DATE - INTERVAL '30 days', 'verified'
        WHERE NOT EXISTS (SELECT 1 FROM right_to_work_checks WHERE tenant_id = v_t_id AND staff_name = 'Sarah Jenkins');

        -- 5. Compliance Hub
        INSERT INTO compliance_persons (tenant_id, full_name, email, person_type, current_stage, compliance_status, overall_compliance_score)
        SELECT v_t_id, 'David Smith', 'd.smith.' || v_t_id || '@example.com', 'EMPLOYEE', 'ONGOING', 'AT_RISK', 75
        WHERE NOT EXISTS (SELECT 1 FROM compliance_persons WHERE tenant_id = v_t_id AND full_name = 'David Smith')
        RETURNING id INTO v_person_id;

        IF v_person_id IS NOT NULL THEN
            INSERT INTO compliance_documents (tenant_id, person_id, document_type_id, file_name, file_path, status, authority, is_current, expiry_date)
            SELECT v_t_id, v_person_id, 'dbs_certificate', 'dbs_cert.pdf', '/storage/docs/dbs.pdf', 'VERIFIED', 'CQC', true, CURRENT_DATE + INTERVAL '30 days'
            WHERE NOT EXISTS (SELECT 1 FROM compliance_documents cd WHERE cd.person_id = v_person_id AND cd.document_type_id = 'dbs_certificate');
            
            INSERT INTO compliance_tasks (tenant_id, person_id, title, description, urgency, status, due_date, task_type)
            SELECT v_t_id, v_person_id, 'Renew DBS Certificate', 'DBS expiring in 30 days', 'MEDIUM', 'PENDING', CURRENT_DATE + INTERVAL '30 days', 'DOCUMENT_EXPIRY'
            WHERE NOT EXISTS (SELECT 1 FROM compliance_tasks ct WHERE ct.person_id = v_person_id AND ct.title = 'Renew DBS Certificate');
        END IF;

    END LOOP;

    RAISE NOTICE 'Multi-tenant compliance seeding completed successfully!';
END $$;
