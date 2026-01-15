-- Compliance Test Data Seed Script
-- Populates compliance dashboards with realistic sample data

DO $$
DECLARE
    org_id uuid;
    emp_id uuid;
BEGIN
    -- Get the first organization
    SELECT id INTO org_id FROM organizations LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE NOTICE 'No organization found, skipping compliance seed';
        RETURN;
    END IF;

    -- Get first employee
    SELECT id INTO emp_id FROM employees WHERE organization_id = org_id LIMIT 1;

    -- ============================================
    -- 1. Seed Compliance Alerts
    -- ============================================
    
    -- Critical alert - visa expiring soon
    INSERT INTO compliance_alerts (organization_id, alert_type, alert_priority, title, description, status, due_date, created_at)
    SELECT org_id, 'visa_expiry', 'critical', 'Visa Expiring in 14 Days', 
           'Maria Santos visa expires on ' || (CURRENT_DATE + INTERVAL '14 days')::text, 
           'active', CURRENT_DATE + INTERVAL '14 days', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM compliance_alerts WHERE title = 'Visa Expiring in 14 Days' AND organization_id = org_id);

    -- High priority - DBS renewal
    INSERT INTO compliance_alerts (organization_id, alert_type, alert_priority, title, description, status, due_date, created_at)
    SELECT org_id, 'dbs_renewal', 'high', 'DBS Certificate Renewal Required', 
           '3 staff members require DBS renewal within 30 days', 
           'active', CURRENT_DATE + INTERVAL '30 days', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM compliance_alerts WHERE title = 'DBS Certificate Renewal Required' AND organization_id = org_id);

    -- Medium - training due
    INSERT INTO compliance_alerts (organization_id, alert_type, alert_priority, title, description, status, due_date, created_at)
    SELECT org_id, 'training_due', 'medium', 'Mandatory Training Due', 
           '5 staff members need to complete safeguarding training', 
           'active', CURRENT_DATE + INTERVAL '60 days', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM compliance_alerts WHERE title = 'Mandatory Training Due' AND organization_id = org_id);

    -- Low - policy review
    INSERT INTO compliance_alerts (organization_id, alert_type, alert_priority, title, description, status, due_date, created_at)
    SELECT org_id, 'policy_review', 'low', 'Annual Policy Review', 
           'Infection Control policy due for annual review', 
           'active', CURRENT_DATE + INTERVAL '90 days', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM compliance_alerts WHERE title = 'Annual Policy Review' AND organization_id = org_id);

    -- ============================================
    -- 2. Seed Visa Records
    -- ============================================
    
    -- Active visa expiring in 30 days
    INSERT INTO visa_records (organization_id, employee_name, visa_type, visa_number, issue_date, expiry_date, current_status, cos_number, created_at)
    SELECT org_id, 'Maria Santos', 'Skilled Worker', 'VIS-2024-001', 
           CURRENT_DATE - INTERVAL '2 years', CURRENT_DATE + INTERVAL '30 days', 
           'active', 'COS-2024-0001', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM visa_records WHERE visa_number = 'VIS-2024-001');

    -- Active visa - expiring in 60 days
    INSERT INTO visa_records (organization_id, employee_name, visa_type, visa_number, issue_date, expiry_date, current_status, cos_number, created_at)
    SELECT org_id, 'Ahmed Khan', 'Skilled Worker', 'VIS-2024-002', 
           CURRENT_DATE - INTERVAL '18 months', CURRENT_DATE + INTERVAL '60 days', 
           'active', 'COS-2024-0002', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM visa_records WHERE visa_number = 'VIS-2024-002');

    -- Active visa - good standing (1 year left)
    INSERT INTO visa_records (organization_id, employee_name, visa_type, visa_number, issue_date, expiry_date, current_status, cos_number, created_at)
    SELECT org_id, 'Priya Patel', 'Skilled Worker', 'VIS-2024-003', 
           CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '365 days', 
           'active', 'COS-2024-0003', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM visa_records WHERE visa_number = 'VIS-2024-003');

    -- ============================================
    -- 3. Seed DBS Certificates
    -- ============================================
    
    -- DBS expiring soon
    INSERT INTO dbs_certificates (organization_id, employee_name, certificate_number, issue_date, expiry_date, level, status, created_at)
    SELECT org_id, 'John Smith', 'DBS-001-2021', 
           CURRENT_DATE - INTERVAL '3 years', CURRENT_DATE + INTERVAL '14 days', 
           'enhanced', 'approved', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM dbs_certificates WHERE certificate_number = 'DBS-001-2021');

    INSERT INTO dbs_certificates (organization_id, employee_name, certificate_number, issue_date, expiry_date, level, status, created_at)
    SELECT org_id, 'Sarah Jones', 'DBS-002-2021', 
           CURRENT_DATE - INTERVAL '3 years', CURRENT_DATE + INTERVAL '21 days', 
           'enhanced', 'approved', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM dbs_certificates WHERE certificate_number = 'DBS-002-2021');

    -- DBS good standing
    INSERT INTO dbs_certificates (organization_id, employee_name, certificate_number, issue_date, expiry_date, level, status, created_at)
    SELECT org_id, 'Mike Wilson', 'DBS-003-2023', 
           CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '2 years', 
           'enhanced', 'approved', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM dbs_certificates WHERE certificate_number = 'DBS-003-2023');

    -- DBS pending
    INSERT INTO dbs_certificates (organization_id, employee_name, certificate_number, issue_date, expiry_date, level, status, created_at)
    SELECT org_id, 'Emma Brown', 'DBS-004-2024', 
           CURRENT_DATE, NULL, 
           'enhanced', 'pending', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM dbs_certificates WHERE certificate_number = 'DBS-004-2024');

    -- ============================================
    -- 4. Seed Right to Work Checks
    -- ============================================
    
    INSERT INTO right_to_work_checks (organization_id, employee_name, check_type, check_date, outcome, document_type, verified_by, created_at)
    SELECT org_id, 'Maria Santos', 'share_code', CURRENT_DATE - INTERVAL '30 days', 
           'passed', 'biometric_residence_permit', 'HR Manager', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM right_to_work_checks WHERE employee_name = 'Maria Santos' AND organization_id = org_id);

    INSERT INTO right_to_work_checks (organization_id, employee_name, check_type, check_date, outcome, document_type, verified_by, created_at)
    SELECT org_id, 'Ahmed Khan', 'share_code', CURRENT_DATE - INTERVAL '60 days', 
           'passed', 'biometric_residence_permit', 'HR Manager', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM right_to_work_checks WHERE employee_name = 'Ahmed Khan' AND organization_id = org_id);

    INSERT INTO right_to_work_checks (organization_id, employee_name, check_type, check_date, outcome, document_type, verified_by, created_at)
    SELECT org_id, 'John Smith', 'manual', CURRENT_DATE - INTERVAL '90 days', 
           'passed', 'passport', 'HR Manager', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM right_to_work_checks WHERE employee_name = 'John Smith' AND organization_id = org_id);

    RAISE NOTICE 'Compliance seed data created successfully for organization %', org_id;
END $$;
