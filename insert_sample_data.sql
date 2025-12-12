-- Insert missing persons (Chen Wei and David Brown)
INSERT INTO compliance_persons (
    id, tenant_id, person_type, current_stage,
    full_name, email, phone, date_of_birth, nationality,
    has_indefinite_leave, visa_type, visa_expiry_date, brp_number, national_insurance_number,
    job_title, department,
    application_date, offer_date, start_date,
    overall_compliance_score, home_office_score, cqc_score, compliance_status
) VALUES (
    'a1000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'EMPLOYEE', 'ONGOING',
    'Chen Wei', 'chen.wei@email.com', '+44 7700 900006',
    '1991-09-03', 'Chinese',
    false, 'Skilled Worker Visa', CURRENT_DATE - INTERVAL '5 days', 'BRP7654321', 'NC778899E',
    'Kitchen Assistant', 'Catering Services',
    NOW() - INTERVAL '3 years', NOW() - INTERVAL '35 months', NOW() - INTERVAL '34 months',
    35, 0, 70, 'NON_COMPLIANT'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO compliance_persons (
    id, tenant_id, person_type, current_stage,
    full_name, email, phone, date_of_birth, nationality,
    has_indefinite_leave, national_insurance_number,
    job_title, department,
    application_date, offer_date, start_date, end_date,
    compliance_status
) VALUES (
    'a1000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'FORMER_EMPLOYEE', 'OFFBOARDING',
    'David Brown', 'david.brown@email.com', '+44 7700 900007',
    '1980-12-25', 'British',
    true, 'DB334455C',
    'Care Coordinator', 'Care Management',
    NOW() - INTERVAL '5 years', NOW() - INTERVAL '58 months', NOW() - INTERVAL '57 months', NOW() - INTERVAL '7 days',
    'COMPLIANT'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample folders
INSERT INTO compliance_folders (id, tenant_id, name, authority, color, icon, is_system_folder, auto_assign_document_types, sort_order)
VALUES 
    ('f1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 
     'Right to Work', 'HOME_OFFICE', '#1E40AF', 'passport', true, 
     ARRAY['rtw_passport', 'rtw_visa', 'rtw_brp', 'rtw_share_code', 'rtw_check_result'], 1),
    ('f1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 
     'Identity Documents', 'HOME_OFFICE', '#3B82F6', 'id-card', true, 
     ARRAY['national_insurance', 'birth_certificate'], 2),
    ('f1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 
     'DBS & Safeguarding', 'CQC', '#7C3AED', 'shield-check', true, 
     ARRAY['dbs_certificate', 'dbs_update_service'], 3),
    ('f1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 
     'Qualifications', 'CQC', '#8B5CF6', 'academic-cap', true, 
     ARRAY['care_certificate', 'nvq_qualification', 'nmc_pin'], 4),
    ('f1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 
     'Training Records', 'CQC', '#A855F7', 'book-open', true, 
     ARRAY['mandatory_training'], 5)
ON CONFLICT (id) DO NOTHING;

-- Insert sample documents for James Wilson (employee 4)
INSERT INTO compliance_documents (
    id, tenant_id, person_id, document_type_id,
    file_name, file_path, file_size, mime_type,
    status, authority, applicable_stages,
    uploaded_at, issue_date, expiry_date, verified_at,
    auto_classified, classification_confidence
) VALUES 
    ('d1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000004', 'rtw_passport',
     'james_wilson_passport.pdf', '/compliance/james_wilson/rtw_passport/', 
     2048000, 'application/pdf',
     'VERIFIED', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT']::compliance_stage[],
     NOW() - INTERVAL '22 months', '2020-01-15', '2030-01-15', NOW() - INTERVAL '22 months',
     true, 98.5),
    ('d1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000004', 'dbs_certificate',
     'james_wilson_dbs.pdf', '/compliance/james_wilson/dbs_certificate/', 
     1024000, 'application/pdf',
     'VERIFIED', 'CQC', ARRAY['PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '10 months', NOW() - INTERVAL '10 months', NOW() + INTERVAL '2 months', NOW() - INTERVAL '10 months',
     true, 97.2)
ON CONFLICT (id) DO NOTHING;

-- Insert document for Emma (expiring training)
INSERT INTO compliance_documents (
    id, tenant_id, person_id, document_type_id,
    file_name, file_path, file_size, mime_type,
    status, authority, applicable_stages,
    uploaded_at, issue_date, expiry_date, verified_at
) VALUES 
    ('d1000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000005', 'mandatory_training',
     'emma_thompson_training.pdf', '/compliance/emma_thompson/mandatory_training/', 
     2560000, 'application/pdf',
     'EXPIRING_SOON', 'CQC', ARRAY['ONBOARDING', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '11 months', NOW() - INTERVAL '11 months', NOW() + INTERVAL '15 days', NOW() - INTERVAL '11 months')
ON CONFLICT (id) DO NOTHING;

-- Insert document for Chen Wei (expired visa)
INSERT INTO compliance_documents (
    id, tenant_id, person_id, document_type_id,
    file_name, file_path, file_size, mime_type,
    status, authority, applicable_stages,
    uploaded_at, issue_date, expiry_date, verified_at
) VALUES 
    ('d1000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000006', 'rtw_visa',
     'chen_wei_visa.pdf', '/compliance/chen_wei/rtw_visa/', 
     1536000, 'application/pdf',
     'EXPIRED', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '34 months', NOW() - INTERVAL '34 months', CURRENT_DATE - INTERVAL '5 days', NOW() - INTERVAL '34 months')
ON CONFLICT (id) DO NOTHING;

-- Insert sample tasks
INSERT INTO compliance_tasks (
    id, tenant_id, person_id, document_id,
    task_type, title, description, urgency, status,
    due_date, is_automated, automation_trigger
) VALUES 
    ('71000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000011',
     'DOCUMENT_EXPIRED', 'URGENT: Chen Wei - Visa Expired',
     'Skilled Worker Visa has expired 5 days ago. Immediate action required.',
     'CRITICAL', 'PENDING',
     CURRENT_DATE, true, 'expiry_check'),
    ('71000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000008',
     'DOCUMENT_EXPIRING', 'Emma Thompson - Training Expiring in 15 days',
     'Mandatory training certificates will expire soon. Schedule refresher.',
     'HIGH', 'PENDING',
     NOW() + INTERVAL '15 days', true, 'expiry_warning_30'),
    ('71000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002',
     'DOCUMENT_EXPIRING', 'James Wilson - DBS Expires in 2 Months',
     'DBS certificate expires soon. Consider renewal.',
     'LOW', 'PENDING',
     NOW() + INTERVAL '60 days', true, 'expiry_warning_90')
ON CONFLICT (id) DO NOTHING;

-- Insert sample notifications
INSERT INTO compliance_notifications (
    id, tenant_id, person_id, document_id, task_id,
    notification_type, urgency, title, message,
    recipients, sent_at, email_sent, in_app_sent
) VALUES 
    ('e1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000011', '71000000-0000-0000-0000-000000000001',
     'DOCUMENT_EXPIRED', 'CRITICAL',
     'CRITICAL: Employee Visa Expired - Immediate Action Required',
     'Chen Wei''s Skilled Worker Visa has expired. The employee cannot legally work.',
     '[{"role": "HR_MANAGER", "email": "hr@company.com"}]'::jsonb,
     NOW() - INTERVAL '5 days', true, true),
    ('e1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000008', '71000000-0000-0000-0000-000000000002',
     'DOCUMENT_EXPIRING', 'HIGH',
     'Training Certificates Expiring Soon - Emma Thompson',
     'Emma Thompson''s mandatory training will expire in 15 days.',
     '[{"role": "LINE_MANAGER", "email": "manager@company.com"}]'::jsonb,
     NOW() - INTERVAL '15 days', true, true)
ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Sample data inserted successfully!';
END $$;
