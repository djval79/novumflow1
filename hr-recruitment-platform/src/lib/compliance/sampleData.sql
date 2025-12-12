-- ===========================================
-- SAMPLE DATA FOR COMPLIANCE SCHEMA TESTING
-- NovumFlow & CareFlow Suite
-- ===========================================
-- Run this AFTER complianceSchema.sql to populate test data
-- Demonstrates various compliance scenarios across all stages
-- ===========================================

-- Use the default tenant created by the schema
-- Tenant ID: 00000000-0000-0000-0000-000000000001

-- ===========================================
-- SAMPLE COMPLIANCE PERSONS
-- ===========================================
-- Creating diverse scenarios to test all compliance features

-- Person 1: New Applicant (UK Citizen) - APPLICATION stage
INSERT INTO compliance_persons (
    id, tenant_id, person_type, current_stage,
    full_name, email, phone, date_of_birth, nationality,
    has_indefinite_leave, job_title, department,
    application_date, compliance_status
) VALUES (
    'a1000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'APPLICANT', 'APPLICATION',
    'Sarah Mitchell', 'sarah.mitchell@email.com', '+44 7700 900001',
    '1992-03-15', 'British',
    true, 'Care Assistant', 'Domiciliary Care',
    NOW() - INTERVAL '3 days', 'PENDING'
);

-- Person 2: Candidate (EU Settled Status) - PRE_EMPLOYMENT stage
INSERT INTO compliance_persons (
    id, tenant_id, person_type, current_stage,
    full_name, email, phone, date_of_birth, nationality,
    has_indefinite_leave, visa_type, share_code, national_insurance_number,
    job_title, department, requires_nmc,
    application_date, compliance_status
) VALUES (
    'a1000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'CANDIDATE', 'PRE_EMPLOYMENT',
    'Marco Rossi', 'marco.rossi@email.com', '+44 7700 900002',
    '1988-07-22', 'Italian',
    false, 'EU Settled Status', 'ABC123XYZ', 'NJ123456C',
    'Senior Care Worker', 'Residential Care', false,
    NOW() - INTERVAL '14 days', 'AT_RISK'
);

-- Person 3: New Hire (Non-EU with Skilled Worker Visa) - ONBOARDING stage
INSERT INTO compliance_persons (
    id, tenant_id, person_type, current_stage,
    full_name, email, phone, date_of_birth, nationality,
    has_indefinite_leave, visa_type, visa_expiry_date, brp_number, national_insurance_number,
    job_title, department, requires_nmc, nmc_pin, nmc_expiry_date,
    application_date, offer_date, start_date, compliance_status
) VALUES (
    'a1000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'NEW_HIRE', 'ONBOARDING',
    'Priya Sharma', 'priya.sharma@email.com', '+44 7700 900003',
    '1990-11-08', 'Indian',
    false, 'Skilled Worker Visa', '2026-06-30', 'ZX1234567', 'NP987654D',
    'Registered Nurse', 'Clinical Services', true, '12A3456E', '2025-03-31',
    NOW() - INTERVAL '45 days', NOW() - INTERVAL '21 days', NOW() + INTERVAL '7 days', 'AT_RISK'
);

-- Person 4: Current Employee (UK Citizen) - ONGOING stage - Fully Compliant
INSERT INTO compliance_persons (
    id, tenant_id, person_type, current_stage,
    full_name, email, phone, date_of_birth, nationality,
    has_indefinite_leave, national_insurance_number,
    job_title, department, requires_nmc,
    application_date, offer_date, start_date,
    overall_compliance_score, home_office_score, cqc_score, compliance_status,
    synced_to_careflow, careflow_sync_date
) VALUES (
    'a1000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'EMPLOYEE', 'ONGOING',
    'James Wilson', 'james.wilson@email.com', '+44 7700 900004',
    '1985-01-20', 'British',
    true, 'NW112233A',
    'Team Leader', 'Domiciliary Care', false,
    NOW() - INTERVAL '2 years', NOW() - INTERVAL '23 months', NOW() - INTERVAL '22 months',
    95, 100, 90, 'COMPLIANT',
    true, NOW() - INTERVAL '1 day'
);

-- Person 5: Employee with Expiring Documents - ONGOING stage - At Risk
INSERT INTO compliance_persons (
    id, tenant_id, person_type, current_stage,
    full_name, email, phone, date_of_birth, nationality,
    has_indefinite_leave, national_insurance_number,
    job_title, department, requires_nmc,
    application_date, offer_date, start_date,
    overall_compliance_score, home_office_score, cqc_score, compliance_status
) VALUES (
    'a1000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'EMPLOYEE', 'ONGOING',
    'Emma Thompson', 'emma.thompson@email.com', '+44 7700 900005',
    '1995-05-12', 'British',
    true, 'NT445566B',
    'Care Assistant', 'Residential Care', false,
    NOW() - INTERVAL '18 months', NOW() - INTERVAL '17 months', NOW() - INTERVAL '16 months',
    72, 100, 65, 'AT_RISK'
);

-- Person 6: Employee with Expired Visa - ONGOING stage - Non-Compliant (CRITICAL)
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
);

-- Person 7: Former Employee - OFFBOARDING stage
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
);

-- ===========================================
-- SAMPLE COMPLIANCE FOLDERS
-- ===========================================

-- System folders for Home Office
INSERT INTO compliance_folders (id, tenant_id, name, authority, color, icon, is_system_folder, auto_assign_document_types, sort_order)
VALUES 
    ('f1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 
     'Right to Work', 'HOME_OFFICE', '#1E40AF', 'passport', true, 
     ARRAY['rtw_passport', 'rtw_visa', 'rtw_brp', 'rtw_share_code', 'rtw_check_result'], 1),
    ('f1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 
     'Identity Documents', 'HOME_OFFICE', '#3B82F6', 'id-card', true, 
     ARRAY['national_insurance', 'birth_certificate'], 2);

-- System folders for CQC
INSERT INTO compliance_folders (id, tenant_id, name, authority, color, icon, is_system_folder, auto_assign_document_types, sort_order)
VALUES 
    ('f1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 
     'DBS & Safeguarding', 'CQC', '#7C3AED', 'shield-check', true, 
     ARRAY['dbs_certificate', 'dbs_update_service'], 3),
    ('f1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 
     'Qualifications', 'CQC', '#8B5CF6', 'academic-cap', true, 
     ARRAY['care_certificate', 'nvq_qualification', 'nmc_pin'], 4),
    ('f1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 
     'Training Records', 'CQC', '#A855F7', 'book-open', true, 
     ARRAY['mandatory_training'], 5),
    ('f1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 
     'Health & Fitness', 'CQC', '#C084FC', 'heart', true, 
     ARRAY['health_declaration', 'occupational_health', 'immunization_records'], 6);

-- System folders for Shared
INSERT INTO compliance_folders (id, tenant_id, name, authority, color, icon, is_system_folder, auto_assign_document_types, sort_order)
VALUES 
    ('f1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 
     'Identity & Verification', 'BOTH', '#059669', 'fingerprint', true, 
     ARRAY['photo_id', 'proof_of_address'], 7),
    ('f1000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 
     'References & History', 'BOTH', '#10B981', 'clipboard-list', true, 
     ARRAY['employment_references', 'cv_resume', 'gaps_explanation'], 8),
    ('f1000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 
     'Contracts & Policies', 'BOTH', '#34D399', 'document-text', true, 
     ARRAY['signed_contract', 'policy_acknowledgements'], 9);

-- System folders for Internal
INSERT INTO compliance_folders (id, tenant_id, name, authority, color, icon, is_system_folder, auto_assign_document_types, sort_order)
VALUES 
    ('f1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 
     'Recruitment Documents', 'INTERNAL', '#F59E0B', 'briefcase', true, 
     ARRAY['application_form', 'interview_notes', 'offer_letter'], 10),
    ('f1000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 
     'Payroll & Administration', 'INTERNAL', '#FBBF24', 'calculator', true, 
     ARRAY['payroll_details', 'emergency_contacts'], 11);

-- ===========================================
-- SAMPLE COMPLIANCE DOCUMENTS
-- ===========================================

-- Documents for Person 4 (James Wilson - Fully Compliant Employee)
INSERT INTO compliance_documents (
    id, tenant_id, person_id, document_type_id,
    file_name, file_path, file_size, mime_type,
    status, authority, applicable_stages,
    uploaded_at, issue_date, expiry_date, verified_at,
    auto_classified, classification_confidence
) VALUES 
    -- Passport (verified)
    ('d1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000004', 'rtw_passport',
     'james_wilson_passport.pdf', '/compliance/a1000000-0000-0000-0000-000000000004/rtw_passport/', 
     2048000, 'application/pdf',
     'VERIFIED', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT']::compliance_stage[],
     NOW() - INTERVAL '22 months', '2020-01-15', '2030-01-15', NOW() - INTERVAL '22 months',
     true, 98.5),
    
    -- NI Number (verified)
    ('d1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000004', 'national_insurance',
     'james_wilson_ni_letter.pdf', '/compliance/a1000000-0000-0000-0000-000000000004/national_insurance/', 
     512000, 'application/pdf',
     'VERIFIED', 'HOME_OFFICE', ARRAY['PRE_EMPLOYMENT', 'ONBOARDING']::compliance_stage[],
     NOW() - INTERVAL '22 months', '2015-06-01', null, NOW() - INTERVAL '22 months',
     true, 95.0),
    
    -- DBS Certificate (verified, expires in 2 months)
    ('d1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000004', 'dbs_certificate',
     'james_wilson_dbs.pdf', '/compliance/a1000000-0000-0000-0000-000000000004/dbs_certificate/', 
     1024000, 'application/pdf',
     'VERIFIED', 'CQC', ARRAY['PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '10 months', NOW() - INTERVAL '10 months', NOW() + INTERVAL '2 months', NOW() - INTERVAL '10 months',
     true, 97.2),
    
    -- Mandatory Training (verified)
    ('d1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000004', 'mandatory_training',
     'james_wilson_training_certs.pdf', '/compliance/a1000000-0000-0000-0000-000000000004/mandatory_training/', 
     3072000, 'application/pdf',
     'VERIFIED', 'CQC', ARRAY['ONBOARDING', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months', NOW() + INTERVAL '9 months', NOW() - INTERVAL '3 months',
     false, null),
    
    -- Signed Contract (verified)
    ('d1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000004', 'signed_contract',
     'james_wilson_contract.pdf', '/compliance/a1000000-0000-0000-0000-000000000004/signed_contract/', 
     768000, 'application/pdf',
     'VERIFIED', 'BOTH', ARRAY['PRE_EMPLOYMENT', 'ONBOARDING']::compliance_stage[],
     NOW() - INTERVAL '22 months', NOW() - INTERVAL '22 months', null, NOW() - INTERVAL '22 months',
     true, 92.0);

-- Documents for Person 5 (Emma Thompson - At Risk - Training Expiring)
INSERT INTO compliance_documents (
    id, tenant_id, person_id, document_type_id,
    file_name, file_path, file_size, mime_type,
    status, authority, applicable_stages,
    uploaded_at, issue_date, expiry_date, verified_at
) VALUES 
    -- Passport (verified)
    ('d1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000005', 'rtw_passport',
     'emma_thompson_passport.pdf', '/compliance/a1000000-0000-0000-0000-000000000005/rtw_passport/', 
     2048000, 'application/pdf',
     'VERIFIED', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT']::compliance_stage[],
     NOW() - INTERVAL '16 months', '2019-05-20', '2029-05-20', NOW() - INTERVAL '16 months'),
    
    -- DBS Certificate (verified)
    ('d1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000005', 'dbs_certificate',
     'emma_thompson_dbs.pdf', '/compliance/a1000000-0000-0000-0000-000000000005/dbs_certificate/', 
     1024000, 'application/pdf',
     'VERIFIED', 'CQC', ARRAY['PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '14 months', NOW() - INTERVAL '14 months', NOW() + INTERVAL '10 months', NOW() - INTERVAL '14 months'),
    
    -- Mandatory Training (EXPIRING SOON - 15 days)
    ('d1000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000005', 'mandatory_training',
     'emma_thompson_training.pdf', '/compliance/a1000000-0000-0000-0000-000000000005/mandatory_training/', 
     2560000, 'application/pdf',
     'EXPIRING_SOON', 'CQC', ARRAY['ONBOARDING', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '11 months', NOW() - INTERVAL '11 months', NOW() + INTERVAL '15 days', NOW() - INTERVAL '11 months'),
    
    -- Care Certificate (PENDING - never uploaded)
    ('d1000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000005', 'care_certificate',
     'emma_thompson_care_cert_pending.pdf', '/compliance/a1000000-0000-0000-0000-000000000005/care_certificate/', 
     0, 'application/pdf',
     'PENDING', 'CQC', ARRAY['PRE_EMPLOYMENT', 'ONBOARDING']::compliance_stage[],
     NOW() - INTERVAL '16 months', null, null, null);

-- Documents for Person 6 (Chen Wei - EXPIRED Visa - Non-Compliant)
INSERT INTO compliance_documents (
    id, tenant_id, person_id, document_type_id,
    file_name, file_path, file_size, mime_type,
    status, authority, applicable_stages,
    uploaded_at, issue_date, expiry_date, verified_at
) VALUES 
    -- Passport (verified)
    ('d1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000006', 'rtw_passport',
     'chen_wei_passport.pdf', '/compliance/a1000000-0000-0000-0000-000000000006/rtw_passport/', 
     2048000, 'application/pdf',
     'VERIFIED', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT']::compliance_stage[],
     NOW() - INTERVAL '34 months', '2018-03-10', '2028-03-10', NOW() - INTERVAL '34 months'),
    
    -- Visa (EXPIRED - 5 days ago!)
    ('d1000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000006', 'rtw_visa',
     'chen_wei_visa.pdf', '/compliance/a1000000-0000-0000-0000-000000000006/rtw_visa/', 
     1536000, 'application/pdf',
     'EXPIRED', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '34 months', NOW() - INTERVAL '34 months', CURRENT_DATE - INTERVAL '5 days', NOW() - INTERVAL '34 months'),
    
    -- BRP (EXPIRED - linked to visa)
    ('d1000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000006', 'rtw_brp',
     'chen_wei_brp.pdf', '/compliance/a1000000-0000-0000-0000-000000000006/rtw_brp/', 
     1024000, 'application/pdf',
     'EXPIRED', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '34 months', NOW() - INTERVAL '34 months', CURRENT_DATE - INTERVAL '5 days', NOW() - INTERVAL '34 months'),
    
    -- DBS (verified - CQC compliant)
    ('d1000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000006', 'dbs_certificate',
     'chen_wei_dbs.pdf', '/compliance/a1000000-0000-0000-0000-000000000006/dbs_certificate/', 
     1024000, 'application/pdf',
     'VERIFIED', 'CQC', ARRAY['PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '10 months', NOW() - INTERVAL '10 months', NOW() + INTERVAL '14 months', NOW() - INTERVAL '10 months');

-- Documents for Person 3 (Priya Sharma - New Hire in Onboarding)
INSERT INTO compliance_documents (
    id, tenant_id, person_id, document_type_id,
    file_name, file_path, file_size, mime_type,
    status, authority, applicable_stages,
    uploaded_at, issue_date, expiry_date, verified_at,
    auto_classified, classification_confidence, extracted_data
) VALUES 
    -- Passport (verified)
    ('d1000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000003', 'rtw_passport',
     'priya_sharma_passport.pdf', '/compliance/a1000000-0000-0000-0000-000000000003/rtw_passport/', 
     2048000, 'application/pdf',
     'VERIFIED', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT']::compliance_stage[],
     NOW() - INTERVAL '30 days', '2022-11-15', '2032-11-15', NOW() - INTERVAL '28 days',
     true, 99.1, '{"passport_number": "K1234567", "nationality": "Indian", "expiry_date": "2032-11-15"}'::jsonb),
    
    -- Skilled Worker Visa (verified, expiring in ~18 months)
    ('d1000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000003', 'rtw_visa',
     'priya_sharma_visa.pdf', '/compliance/a1000000-0000-0000-0000-000000000003/rtw_visa/', 
     1536000, 'application/pdf',
     'VERIFIED', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '30 days', NOW() - INTERVAL '6 months', '2026-06-30', NOW() - INTERVAL '28 days',
     true, 97.5, '{"visa_type": "Skilled Worker", "sponsor": "Care Provider Ltd", "expiry": "2026-06-30"}'::jsonb),
    
    -- BRP (verified)
    ('d1000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000003', 'rtw_brp',
     'priya_sharma_brp.pdf', '/compliance/a1000000-0000-0000-0000-000000000003/rtw_brp/', 
     1024000, 'application/pdf',
     'VERIFIED', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '30 days', NOW() - INTERVAL '6 months', '2026-06-30', NOW() - INTERVAL '28 days',
     true, 96.8, '{"brp_number": "ZX1234567", "expiry": "2026-06-30"}'::jsonb),
    
    -- NMC PIN (EXPIRING SOON - needs renewal in ~3.5 months)
    ('d1000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000003', 'nmc_pin',
     'priya_sharma_nmc.pdf', '/compliance/a1000000-0000-0000-0000-000000000003/nmc_pin/', 
     512000, 'application/pdf',
     'EXPIRING_SOON', 'CQC', ARRAY['APPLICATION', 'PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '30 days', NOW() - INTERVAL '9 months', '2025-03-31', NOW() - INTERVAL '28 days',
     true, 94.2, '{"nmc_pin": "12A3456E", "registration_type": "Registered Nurse - Adult", "expiry": "2025-03-31"}'::jsonb),
    
    -- DBS (under review)
    ('d1000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000003', 'dbs_certificate',
     'priya_sharma_dbs.pdf', '/compliance/a1000000-0000-0000-0000-000000000003/dbs_certificate/', 
     1024000, 'application/pdf',
     'UNDER_REVIEW', 'CQC', ARRAY['PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[],
     NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() + INTERVAL '2 years', null,
     true, 91.0, '{"dbs_number": "001234567890", "certificate_date": "2024-11-28"}'::jsonb),
    
    -- Mandatory Training (pending - onboarding requirement)
    ('d1000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 
     'a1000000-0000-0000-0000-000000000003', 'mandatory_training',
     'placeholder_training.pdf', '/compliance/a1000000-0000-0000-0000-000000000003/mandatory_training/', 
     0, 'application/pdf',
     'PENDING', 'CQC', ARRAY['ONBOARDING', 'ONGOING']::compliance_stage[],
     NOW(), null, null, null,
     false, null, null);

-- ===========================================
-- SAMPLE COMPLIANCE CHECKLISTS
-- ===========================================

-- Checklist for Person 3 (Priya Sharma - Onboarding)
INSERT INTO compliance_checklists (
    id, tenant_id, person_id, document_type_id,
    status, is_required, is_applicable, stage, authority,
    document_id, due_date
) VALUES 
    ('c1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003', 'rtw_passport',
     'VERIFIED', true, true, 'PRE_EMPLOYMENT', 'HOME_OFFICE',
     'd1000000-0000-0000-0000-000000000014', NOW() - INTERVAL '21 days'),
    
    ('c1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003', 'rtw_visa',
     'VERIFIED', true, true, 'PRE_EMPLOYMENT', 'HOME_OFFICE',
     'd1000000-0000-0000-0000-000000000015', NOW() - INTERVAL '21 days'),
    
    ('c1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003', 'rtw_brp',
     'VERIFIED', true, true, 'PRE_EMPLOYMENT', 'HOME_OFFICE',
     'd1000000-0000-0000-0000-000000000016', NOW() - INTERVAL '21 days'),
    
    ('c1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003', 'nmc_pin',
     'EXPIRING_SOON', true, true, 'PRE_EMPLOYMENT', 'CQC',
     'd1000000-0000-0000-0000-000000000017', NOW() - INTERVAL '21 days'),
    
    ('c1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003', 'dbs_certificate',
     'UNDER_REVIEW', true, true, 'PRE_EMPLOYMENT', 'CQC',
     'd1000000-0000-0000-0000-000000000018', NOW() - INTERVAL '7 days'),
    
    ('c1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003', 'mandatory_training',
     'PENDING', true, true, 'ONBOARDING', 'CQC',
     null, NOW() + INTERVAL '14 days');

-- ===========================================
-- SAMPLE COMPLIANCE TASKS
-- ===========================================

-- Critical task: Chen Wei's expired visa
INSERT INTO compliance_tasks (
    id, tenant_id, person_id, document_id,
    task_type, title, description, urgency, status,
    due_date, is_automated, automation_trigger
) VALUES 
    ('t1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000011',
     'DOCUMENT_EXPIRED', 'URGENT: Chen Wei - Visa Expired',
     'Skilled Worker Visa has expired 5 days ago. Immediate action required. Employee cannot legally work until visa is renewed or extended.',
     'CRITICAL', 'PENDING',
     CURRENT_DATE, true, 'expiry_check');

-- High priority task: Emma's training expiring
INSERT INTO compliance_tasks (
    id, tenant_id, person_id, document_id,
    task_type, title, description, urgency, status,
    due_date, is_automated, automation_trigger
) VALUES 
    ('t1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000008',
     'DOCUMENT_EXPIRING', 'Emma Thompson - Mandatory Training Expiring in 15 days',
     'Mandatory training certificates will expire in 15 days. Schedule refresher training immediately.',
     'HIGH', 'PENDING',
     NOW() + INTERVAL '15 days', true, 'expiry_warning_30');

-- Medium priority: Priya's DBS verification
INSERT INTO compliance_tasks (
    id, tenant_id, person_id, document_id,
    task_type, title, description, urgency, status,
    due_date, is_automated, automation_trigger
) VALUES 
    ('t1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000018',
     'DOCUMENT_REVIEW', 'Priya Sharma - DBS Certificate Verification Required',
     'DBS certificate uploaded and awaiting HR verification. Employee starts in 7 days.',
     'MEDIUM', 'PENDING',
     NOW() + INTERVAL '3 days', false, null);

-- Low priority: James' DBS renewal reminder
INSERT INTO compliance_tasks (
    id, tenant_id, person_id, document_id,
    task_type, title, description, urgency, status,
    due_date, is_automated, automation_trigger
) VALUES 
    ('t1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000003',
     'DOCUMENT_EXPIRING', 'James Wilson - DBS Certificate Expires in 2 Months',
     'DBS certificate expires in approximately 60 days. Consider DBS Update Service enrollment.',
     'LOW', 'PENDING',
     NOW() + INTERVAL '60 days', true, 'expiry_warning_90');

-- Completed task: Priya's references
INSERT INTO compliance_tasks (
    id, tenant_id, person_id,
    task_type, title, description, urgency, status,
    due_date, completed_at, is_automated, automation_trigger
) VALUES 
    ('t1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003',
     'REFERENCE_CHECK', 'Priya Sharma - Employment References Collected',
     'All required employment references have been collected and verified.',
     'MEDIUM', 'COMPLETED',
     NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days', true, 'reference_chase_7');

-- ===========================================
-- SAMPLE COMPLIANCE NOTIFICATIONS
-- ===========================================

-- Critical notification for Chen Wei
INSERT INTO compliance_notifications (
    id, tenant_id, person_id, document_id, task_id,
    notification_type, urgency, title, message,
    recipients, sent_at, email_sent, in_app_sent
) VALUES 
    ('n1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000011', 't1000000-0000-0000-0000-000000000001',
     'DOCUMENT_EXPIRED', 'CRITICAL',
     '🚨 CRITICAL: Employee Visa Expired - Immediate Action Required',
     'Chen Wei''s Skilled Worker Visa expired on ' || (CURRENT_DATE - INTERVAL '5 days')::text || '. The employee cannot legally work until this is resolved. Please suspend work duties and initiate visa renewal process immediately.',
     '[{"role": "HR_MANAGER", "email": "hr@company.com"}, {"role": "COMPLIANCE_OFFICER", "email": "compliance@company.com"}]'::jsonb,
     NOW() - INTERVAL '5 days', true, true);

-- Warning notification for Emma
INSERT INTO compliance_notifications (
    id, tenant_id, person_id, document_id, task_id,
    notification_type, urgency, title, message,
    recipients, sent_at, email_sent, in_app_sent
) VALUES 
    ('n1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000008', 't1000000-0000-0000-0000-000000000002',
     'DOCUMENT_EXPIRING', 'HIGH',
     '⚠️ Training Certificates Expiring Soon - Emma Thompson',
     'Emma Thompson''s mandatory training certificates will expire in 15 days. Please schedule refresher training to maintain CQC compliance.',
     '[{"role": "LINE_MANAGER", "email": "manager@company.com"}, {"role": "TRAINING_COORDINATOR", "email": "training@company.com"}]'::jsonb,
     NOW() - INTERVAL '15 days', true, true);

-- Onboarding reminder for Priya
INSERT INTO compliance_notifications (
    id, tenant_id, person_id, task_id,
    notification_type, urgency, title, message,
    recipients, sent_at, email_sent, in_app_sent
) VALUES 
    ('n1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003', 't1000000-0000-0000-0000-000000000003',
     'ONBOARDING_REMINDER', 'MEDIUM',
     '📋 Onboarding Compliance Check - Priya Sharma (Starts in 7 days)',
     'Priya Sharma is due to start on ' || (NOW() + INTERVAL '7 days')::date::text || '. Please ensure all pending compliance documents are verified before start date. Outstanding: DBS verification, Mandatory training enrollment.',
     '[{"role": "HR_COORDINATOR", "email": "hr-onboarding@company.com"}]'::jsonb,
     NOW(), true, true);

-- ===========================================
-- SAMPLE STAGE HISTORY
-- ===========================================

-- Priya's progression through stages
INSERT INTO compliance_stage_history (
    id, tenant_id, person_id,
    from_stage, to_stage,
    auto_progressed, progress_reason,
    compliance_score_at_transition, missing_documents,
    created_at
) VALUES 
    ('h1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003',
     null, 'APPLICATION',
     false, 'Initial application received',
     0, ARRAY['rtw_passport', 'cv_resume', 'photo_id'],
     NOW() - INTERVAL '45 days'),
    
    ('h1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003',
     'APPLICATION', 'PRE_EMPLOYMENT',
     true, 'All application stage documents verified',
     75, ARRAY['dbs_certificate', 'employment_references'],
     NOW() - INTERVAL '30 days'),
    
    ('h1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003',
     'PRE_EMPLOYMENT', 'ONBOARDING',
     false, 'Offer accepted, progressed to onboarding',
     85, ARRAY['mandatory_training', 'policy_acknowledgements'],
     NOW() - INTERVAL '7 days');

-- ===========================================
-- SAMPLE SYNC LOG (Cross-App Sync)
-- ===========================================

-- James Wilson synced to CareFlow
INSERT INTO compliance_sync_log (
    id, tenant_id,
    source_app, target_app, sync_type,
    source_entity_id, target_entity_id, entity_type,
    status, sync_started_at, sync_completed_at,
    sync_data
) VALUES 
    ('s1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'novumflow', 'careflow', 'PERSON_FULL',
     'a1000000-0000-0000-0000-000000000004', 'cf-a1000000-0000-0000-0000-000000000004', 'compliance_person',
     'COMPLETED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day',
     '{"full_name": "James Wilson", "job_title": "Team Leader", "compliance_score": 95, "documents_synced": 5}'::jsonb);

-- ===========================================
-- SAMPLE AUDIT LOG
-- ===========================================

INSERT INTO compliance_audit_log (
    id, tenant_id,
    action, entity_type, entity_id,
    user_id, user_email, user_role,
    old_values, new_values
) VALUES 
    ('al1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'DOCUMENT_VERIFIED', 'compliance_document', 'd1000000-0000-0000-0000-000000000014',
     null, 'hr.admin@company.com', 'HR_ADMIN',
     '{"status": "UPLOADED"}'::jsonb,
     '{"status": "VERIFIED", "verified_at": "2024-11-14T10:30:00Z"}'::jsonb),
    
    ('al1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'STAGE_PROGRESSION', 'compliance_person', 'a1000000-0000-0000-0000-000000000003',
     null, 'system@novumflow.com', 'SYSTEM',
     '{"current_stage": "PRE_EMPLOYMENT"}'::jsonb,
     '{"current_stage": "ONBOARDING", "reason": "Offer accepted"}'::jsonb),
    
    ('al1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
     'DOCUMENT_EXPIRED', 'compliance_document', 'd1000000-0000-0000-0000-000000000011',
     null, 'system@novumflow.com', 'SYSTEM',
     '{"status": "VERIFIED"}'::jsonb,
     '{"status": "EXPIRED", "expired_at": "' || (CURRENT_DATE - INTERVAL '5 days')::text || '"}'::jsonb);

-- ===========================================
-- ASSIGN DOCUMENTS TO FOLDERS
-- ===========================================

-- James Wilson's documents
INSERT INTO compliance_document_folders (document_id, folder_id, assigned_at)
VALUES 
    ('d1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', NOW()), -- Passport -> Right to Work
    ('d1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000002', NOW()), -- NI -> Identity
    ('d1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000003', NOW()), -- DBS -> DBS & Safeguarding
    ('d1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000005', NOW()), -- Training -> Training Records
    ('d1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000009', NOW()); -- Contract -> Contracts

-- Chen Wei's documents (expired visa)
INSERT INTO compliance_document_folders (document_id, folder_id, assigned_at)
VALUES 
    ('d1000000-0000-0000-0000-000000000010', 'f1000000-0000-0000-0000-000000000001', NOW()), -- Passport
    ('d1000000-0000-0000-0000-000000000011', 'f1000000-0000-0000-0000-000000000001', NOW()), -- Visa (expired)
    ('d1000000-0000-0000-0000-000000000012', 'f1000000-0000-0000-0000-000000000001', NOW()), -- BRP (expired)
    ('d1000000-0000-0000-0000-000000000013', 'f1000000-0000-0000-0000-000000000003', NOW()); -- DBS

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Run these after inserting to verify the data

-- 1. Check all compliance persons with their status
-- SELECT full_name, person_type, current_stage, compliance_status, overall_compliance_score, home_office_score, cqc_score FROM compliance_persons ORDER BY compliance_status DESC;

-- 2. Check expiring documents view
-- SELECT * FROM v_expiring_documents ORDER BY days_until_expiry ASC;

-- 3. Check compliance status view
-- SELECT * FROM v_compliance_status;

-- 4. Count tasks by urgency
-- SELECT urgency, COUNT(*) FROM compliance_tasks GROUP BY urgency ORDER BY urgency;

-- 5. Test the compliance score function
-- SELECT * FROM calculate_compliance_score('a1000000-0000-0000-0000-000000000004');

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Sample data inserted successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - 7 Compliance Persons (various stages)';
    RAISE NOTICE '  - 11 Smart Folders (organized by authority)';
    RAISE NOTICE '  - 19 Compliance Documents';
    RAISE NOTICE '  - 6 Checklist Items';
    RAISE NOTICE '  - 5 Compliance Tasks (various urgencies)';
    RAISE NOTICE '  - 3 Notifications';
    RAISE NOTICE '  - 3 Stage History Records';
    RAISE NOTICE '  - 1 Sync Log Entry';
    RAISE NOTICE '  - 3 Audit Log Entries';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Test Scenarios:';
    RAISE NOTICE '  1. Sarah Mitchell - New applicant (UK citizen)';
    RAISE NOTICE '  2. Marco Rossi - EU Settled Status candidate';
    RAISE NOTICE '  3. Priya Sharma - Nurse in onboarding (visa holder)';
    RAISE NOTICE '  4. James Wilson - Fully compliant employee';
    RAISE NOTICE '  5. Emma Thompson - At-risk (expiring training)';
    RAISE NOTICE '  6. Chen Wei - NON-COMPLIANT (expired visa!)';
    RAISE NOTICE '  7. David Brown - Former employee';
    RAISE NOTICE '========================================';
END $$;
