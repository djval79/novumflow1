-- References table for applicant reference management
CREATE TABLE IF NOT EXISTS references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    ref_name VARCHAR(255) NOT NULL,
    ref_email VARCHAR(255) NOT NULL,
    ref_phone VARCHAR(50),
    ref_company VARCHAR(255),
    ref_position VARCHAR(255),
    ref_relationship VARCHAR(100) NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'requested', 'received', 'verified', 'failed', 'expired')),
    verification_request_sent_at TIMESTAMP,
    verification_received_at TIMESTAMP,
    ref_response TEXT,
    ref_score INTEGER CHECK (ref_score >= 0 AND ref_score <= 10),
    ref_rating VARCHAR(50) CHECK (ref_rating IN ('excellent', 'good', 'satisfactory', 'poor', 'not_recommended')),
    would_rehire BOOLEAN,
    verification_notes TEXT,
    verified_by UUID,
    verified_at TIMESTAMP,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_references_application_id ON references(application_id);
CREATE INDEX IF NOT EXISTS idx_references_verification_status ON references(verification_status);
CREATE INDEX IF NOT EXISTS idx_references_email ON references(ref_email);

-- Enable RLS
ALTER TABLE references ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read for authenticated users" ON references
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON references
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON references
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow delete for service role" ON references
    FOR DELETE USING (auth.role() = 'service_role');
-- DBS Certificates table for background check tracking
CREATE TABLE IF NOT EXISTS dbs_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    application_id UUID,
    certificate_type VARCHAR(100) NOT NULL CHECK (certificate_type IN ('basic', 'standard', 'enhanced', 'enhanced_with_barred_lists')),
    certificate_number VARCHAR(100) UNIQUE,
    applicant_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'in_progress', 'approved', 'rejected', 'expired', 'renewed')),
    verification_method VARCHAR(100) CHECK (verification_method IN ('online_check', 'document_upload', 'update_service', 'manual_verification')),
    online_check_code VARCHAR(50),
    document_url TEXT,
    document_verified BOOLEAN DEFAULT false,
    verification_date DATE,
    verified_by UUID,
    disclosure_information TEXT,
    has_disclosures BOOLEAN DEFAULT false,
    risk_assessment TEXT,
    risk_level VARCHAR(50) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    compliance_notes TEXT,
    renewal_reminder_sent BOOLEAN DEFAULT false,
    renewal_reminder_date DATE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- DBS Verification Logs table
CREATE TABLE IF NOT EXISTS dbs_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dbs_certificate_id UUID NOT NULL,
    verification_action VARCHAR(100) NOT NULL,
    verification_method VARCHAR(100),
    verification_result VARCHAR(50),
    verification_details TEXT,
    verified_by UUID NOT NULL,
    verified_at TIMESTAMP DEFAULT NOW()
);

-- DBS Compliance Records table
CREATE TABLE IF NOT EXISTS dbs_compliance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    compliance_check_date DATE NOT NULL,
    dbs_status VARCHAR(50) NOT NULL,
    compliance_status VARCHAR(50) CHECK (compliance_status IN ('compliant', 'non_compliant', 'pending_renewal', 'expired')),
    compliance_notes TEXT,
    next_check_date DATE,
    checked_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dbs_certificates_employee_id ON dbs_certificates(employee_id);
CREATE INDEX IF NOT EXISTS idx_dbs_certificates_application_id ON dbs_certificates(application_id);
CREATE INDEX IF NOT EXISTS idx_dbs_certificates_status ON dbs_certificates(status);
CREATE INDEX IF NOT EXISTS idx_dbs_certificates_expiry_date ON dbs_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_dbs_verification_logs_certificate_id ON dbs_verification_logs(dbs_certificate_id);
CREATE INDEX IF NOT EXISTS idx_dbs_compliance_records_employee_id ON dbs_compliance_records(employee_id);

-- Enable RLS
ALTER TABLE dbs_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dbs_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dbs_compliance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dbs_certificates
CREATE POLICY "Allow read for authenticated users" ON dbs_certificates
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON dbs_certificates
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON dbs_certificates
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow delete for service role" ON dbs_certificates
    FOR DELETE USING (auth.role() = 'service_role');

-- RLS Policies for dbs_verification_logs
CREATE POLICY "Allow read for authenticated users" ON dbs_verification_logs
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON dbs_verification_logs
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- RLS Policies for dbs_compliance_records
CREATE POLICY "Allow read for authenticated users" ON dbs_compliance_records
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON dbs_compliance_records
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON dbs_compliance_records
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));
-- Visa Records table for immigration status tracking
CREATE TABLE IF NOT EXISTS visa_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    visa_type VARCHAR(100) NOT NULL,
    visa_subtype VARCHAR(100),
    visa_number VARCHAR(100) UNIQUE,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    issuing_country VARCHAR(100) NOT NULL,
    current_status VARCHAR(50) DEFAULT 'active' CHECK (current_status IN ('active', 'expired', 'renewed', 'cancelled', 'pending_renewal')),
    biometric_residence_permit_number VARCHAR(100),
    brp_expiry_date DATE,
    sponsor_licence_number VARCHAR(100),
    cos_number VARCHAR(100),
    cos_issue_date DATE,
    immigration_status VARCHAR(100),
    right_to_work_status VARCHAR(50) CHECK (right_to_work_status IN ('full', 'restricted', 'temporary', 'expired', 'pending')),
    work_restrictions TEXT,
    hours_per_week_limit INTEGER,
    allowed_occupations TEXT,
    no_recourse_public_funds BOOLEAN DEFAULT false,
    document_url TEXT,
    verification_date DATE,
    verified_by UUID,
    renewal_reminder_30_days BOOLEAN DEFAULT false,
    renewal_reminder_60_days BOOLEAN DEFAULT false,
    renewal_reminder_90_days BOOLEAN DEFAULT false,
    compliance_notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Right to Work Checks table
CREATE TABLE IF NOT EXISTS right_to_work_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    check_type VARCHAR(100) NOT NULL CHECK (check_type IN ('pre_employment', 'periodic', 'follow_up', 'sponsor_licence_audit')),
    check_date DATE NOT NULL,
    check_method VARCHAR(100) CHECK (check_method IN ('manual', 'online_service', 'idsp', 'employer_checking_service')),
    document_types_checked TEXT,
    check_result VARCHAR(50) CHECK (check_result IN ('pass', 'fail', 'refer', 'pending')),
    right_to_work_confirmed BOOLEAN DEFAULT false,
    time_limited BOOLEAN DEFAULT false,
    follow_up_date DATE,
    statutory_excuse_obtained BOOLEAN DEFAULT false,
    copies_retained BOOLEAN DEFAULT false,
    checking_service_reference VARCHAR(100),
    notes TEXT,
    checked_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Compliance Alerts table
CREATE TABLE IF NOT EXISTS compliance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    alert_type VARCHAR(100) NOT NULL CHECK (alert_type IN ('visa_expiry', 'brp_expiry', 'rtw_check_due', 'dbs_expiry', 'document_expiry', 'sponsor_duty', 'compliance_breach')),
    alert_priority VARCHAR(50) DEFAULT 'medium' CHECK (alert_priority IN ('low', 'medium', 'high', 'critical', 'urgent')),
    alert_title VARCHAR(255) NOT NULL,
    alert_message TEXT NOT NULL,
    alert_date DATE NOT NULL,
    due_date DATE,
    days_until_due INTEGER,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed', 'escalated')),
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP,
    resolved_by UUID,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit Packs table for Home Office compliance reporting
CREATE TABLE IF NOT EXISTS audit_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_name VARCHAR(255) NOT NULL,
    pack_type VARCHAR(100) CHECK (pack_type IN ('sponsor_licence_audit', 'right_to_work_audit', 'compliance_review', 'custom')),
    employee_ids TEXT,
    date_range_start DATE,
    date_range_end DATE,
    generated_date DATE DEFAULT CURRENT_DATE,
    generated_by UUID NOT NULL,
    pack_status VARCHAR(50) DEFAULT 'draft' CHECK (pack_status IN ('draft', 'finalized', 'submitted', 'archived')),
    document_url TEXT,
    includes_visa_records BOOLEAN DEFAULT true,
    includes_rtw_checks BOOLEAN DEFAULT true,
    includes_dbs_certificates BOOLEAN DEFAULT false,
    includes_compliance_history BOOLEAN DEFAULT true,
    summary_statistics TEXT,
    compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
    issues_identified TEXT,
    recommendations TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Home Office Forms table
CREATE TABLE IF NOT EXISTS home_office_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_type VARCHAR(100) NOT NULL,
    form_reference VARCHAR(100),
    employee_id UUID NOT NULL,
    form_data TEXT NOT NULL,
    form_status VARCHAR(50) DEFAULT 'draft' CHECK (form_status IN ('draft', 'pending_review', 'approved', 'submitted', 'rejected')),
    generated_date DATE DEFAULT CURRENT_DATE,
    submitted_date DATE,
    approved_by UUID,
    approved_at TIMESTAMP,
    form_url TEXT,
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_visa_records_employee_id ON visa_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_visa_records_expiry_date ON visa_records(expiry_date);
CREATE INDEX IF NOT EXISTS idx_visa_records_status ON visa_records(current_status);
CREATE INDEX IF NOT EXISTS idx_rtw_checks_employee_id ON right_to_work_checks(employee_id);
CREATE INDEX IF NOT EXISTS idx_rtw_checks_check_date ON right_to_work_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_employee_id ON compliance_alerts(employee_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_status ON compliance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_due_date ON compliance_alerts(due_date);
CREATE INDEX IF NOT EXISTS idx_audit_packs_generated_date ON audit_packs(generated_date);
CREATE INDEX IF NOT EXISTS idx_home_office_forms_employee_id ON home_office_forms(employee_id);

-- Enable RLS
ALTER TABLE visa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE right_to_work_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_office_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visa_records
CREATE POLICY "Allow read for authenticated users" ON visa_records
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON visa_records
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON visa_records
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow delete for service role" ON visa_records
    FOR DELETE USING (auth.role() = 'service_role');

-- RLS Policies for right_to_work_checks
CREATE POLICY "Allow read for authenticated users" ON right_to_work_checks
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON right_to_work_checks
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON right_to_work_checks
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

-- RLS Policies for compliance_alerts
CREATE POLICY "Allow read for authenticated users" ON compliance_alerts
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON compliance_alerts
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON compliance_alerts
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow delete for service role" ON compliance_alerts
    FOR DELETE USING (auth.role() = 'service_role');

-- RLS Policies for audit_packs
CREATE POLICY "Allow read for authenticated users" ON audit_packs
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON audit_packs
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON audit_packs
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

-- RLS Policies for home_office_forms
CREATE POLICY "Allow read for authenticated users" ON home_office_forms
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON home_office_forms
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON home_office_forms
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));
-- Biometric Enrollment table
CREATE TABLE IF NOT EXISTS biometric_enrollment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL UNIQUE,
    fingerprint_template_encrypted TEXT,
    face_template_encrypted TEXT,
    biometric_type VARCHAR(50) CHECK (biometric_type IN ('fingerprint', 'face', 'both')),
    enrollment_date DATE NOT NULL,
    enrollment_status VARCHAR(50) DEFAULT 'active' CHECK (enrollment_status IN ('active', 'inactive', 'expired', 'revoked')),
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    device_id VARCHAR(100),
    enrolled_by UUID NOT NULL,
    last_verification_date TIMESTAMP,
    verification_count INTEGER DEFAULT 0,
    failed_verification_count INTEGER DEFAULT 0,
    template_version VARCHAR(20),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Biometric Attendance Logs table
CREATE TABLE IF NOT EXISTS biometric_attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    log_type VARCHAR(50) CHECK (log_type IN ('clock_in', 'clock_out', 'break_start', 'break_end')),
    log_timestamp TIMESTAMP NOT NULL,
    biometric_type VARCHAR(50) CHECK (biometric_type IN ('fingerprint', 'face')),
    verification_status VARCHAR(50) CHECK (verification_status IN ('success', 'failed', 'low_confidence', 'rejected')),
    confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    device_id VARCHAR(100),
    location VARCHAR(255),
    ip_address VARCHAR(50),
    photo_url TEXT,
    anomaly_detected BOOLEAN DEFAULT false,
    anomaly_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Biometric Verification Logs table
CREATE TABLE IF NOT EXISTS biometric_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    verification_type VARCHAR(100) CHECK (verification_type IN ('attendance', 'access_control', 'document_access', 'system_login', 'secure_action')),
    verification_timestamp TIMESTAMP NOT NULL,
    biometric_method VARCHAR(50) CHECK (biometric_method IN ('fingerprint', 'face', 'multi_factor')),
    verification_result VARCHAR(50) CHECK (verification_result IN ('success', 'failed', 'timeout', 'rejected')),
    confidence_score DECIMAL(5,2),
    attempt_count INTEGER DEFAULT 1,
    device_id VARCHAR(100),
    action_performed VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Biometric Security Events table
CREATE TABLE IF NOT EXISTS biometric_security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL CHECK (event_type IN ('suspicious_activity', 'multiple_failed_attempts', 'template_tampering', 'unauthorized_access', 'device_anomaly', 'policy_violation')),
    employee_id UUID,
    event_timestamp TIMESTAMP NOT NULL,
    severity_level VARCHAR(50) CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    event_description TEXT NOT NULL,
    device_id VARCHAR(100),
    ip_address VARCHAR(50),
    action_taken TEXT,
    investigated_by UUID,
    investigation_status VARCHAR(50) DEFAULT 'pending' CHECK (investigation_status IN ('pending', 'investigating', 'resolved', 'false_positive')),
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_biometric_enrollment_employee_id ON biometric_enrollment(employee_id);
CREATE INDEX IF NOT EXISTS idx_biometric_attendance_employee_id ON biometric_attendance_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_biometric_attendance_timestamp ON biometric_attendance_logs(log_timestamp);
CREATE INDEX IF NOT EXISTS idx_biometric_verification_employee_id ON biometric_verification_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_biometric_verification_timestamp ON biometric_verification_logs(verification_timestamp);
CREATE INDEX IF NOT EXISTS idx_biometric_security_events_timestamp ON biometric_security_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_biometric_security_events_severity ON biometric_security_events(severity_level);

-- Enable RLS
ALTER TABLE biometric_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for biometric_enrollment
CREATE POLICY "Allow read for authenticated users" ON biometric_enrollment
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON biometric_enrollment
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON biometric_enrollment
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow delete for service role" ON biometric_enrollment
    FOR DELETE USING (auth.role() = 'service_role');

-- RLS Policies for biometric_attendance_logs
CREATE POLICY "Allow read for authenticated users" ON biometric_attendance_logs
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON biometric_attendance_logs
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- RLS Policies for biometric_verification_logs
CREATE POLICY "Allow read for authenticated users" ON biometric_verification_logs
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON biometric_verification_logs
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- RLS Policies for biometric_security_events
CREATE POLICY "Allow read for authenticated users" ON biometric_security_events
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON biometric_security_events
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON biometric_security_events
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));
-- Automation Rules table
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100) NOT NULL CHECK (rule_type IN ('compliance_check', 'workflow_routing', 'notification', 'document_generation', 'data_validation', 'scheduled_task')),
    trigger_event VARCHAR(100) NOT NULL,
    trigger_conditions TEXT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_config TEXT NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    is_active BOOLEAN DEFAULT true,
    execution_order INTEGER DEFAULT 1,
    failure_action VARCHAR(100) DEFAULT 'log' CHECK (failure_action IN ('log', 'retry', 'alert', 'escalate', 'skip')),
    max_retries INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 300,
    last_executed_at TIMESTAMP,
    last_execution_status VARCHAR(50),
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Automation Execution Logs table
CREATE TABLE IF NOT EXISTS automation_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL,
    execution_timestamp TIMESTAMP NOT NULL,
    trigger_event VARCHAR(100) NOT NULL,
    trigger_data TEXT,
    execution_status VARCHAR(50) CHECK (execution_status IN ('success', 'failed', 'partial', 'skipped', 'retrying')),
    execution_duration_ms INTEGER,
    actions_performed TEXT,
    output_data TEXT,
    error_message TEXT,
    error_stack TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notification Preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    compliance_alerts BOOLEAN DEFAULT true,
    workflow_updates BOOLEAN DEFAULT true,
    document_notifications BOOLEAN DEFAULT true,
    system_alerts BOOLEAN DEFAULT true,
    daily_digest BOOLEAN DEFAULT false,
    weekly_report BOOLEAN DEFAULT true,
    notification_frequency VARCHAR(50) DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Scheduled Tasks table
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name VARCHAR(255) NOT NULL,
    task_type VARCHAR(100) NOT NULL CHECK (task_type IN ('compliance_check', 'data_cleanup', 'report_generation', 'reminder_notification', 'data_sync', 'backup')),
    schedule_pattern VARCHAR(100) NOT NULL,
    schedule_config TEXT,
    next_execution_time TIMESTAMP NOT NULL,
    last_execution_time TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    execution_status VARCHAR(50) DEFAULT 'pending',
    task_config TEXT NOT NULL,
    execution_history TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Document Processing Queue table
CREATE TABLE IF NOT EXISTS document_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    processing_type VARCHAR(100) NOT NULL CHECK (processing_type IN ('ocr', 'validation', 'classification', 'extraction', 'virus_scan', 'compression')),
    queue_status VARCHAR(50) DEFAULT 'pending' CHECK (queue_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    queued_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    processing_duration_ms INTEGER,
    processing_result TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger_event ON automation_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_automation_rules_is_active ON automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_execution_logs_rule_id ON automation_execution_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_execution_logs_timestamp ON automation_execution_logs(execution_timestamp);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_execution ON scheduled_tasks(next_execution_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_is_active ON scheduled_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_document_processing_queue_status ON document_processing_queue(queue_status);

-- Enable RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_processing_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_rules
CREATE POLICY "Allow read for authenticated users" ON automation_rules
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON automation_rules
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON automation_rules
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow delete for service role" ON automation_rules
    FOR DELETE USING (auth.role() = 'service_role');

-- RLS Policies for automation_execution_logs
CREATE POLICY "Allow read for authenticated users" ON automation_execution_logs
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON automation_execution_logs
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- RLS Policies for notification_preferences
CREATE POLICY "Allow read for authenticated users" ON notification_preferences
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON notification_preferences
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON notification_preferences
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

-- RLS Policies for scheduled_tasks
CREATE POLICY "Allow read for authenticated users" ON scheduled_tasks
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON scheduled_tasks
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON scheduled_tasks
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

-- RLS Policies for document_processing_queue
CREATE POLICY "Allow read for authenticated users" ON document_processing_queue
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON document_processing_queue
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON document_processing_queue
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));
-- Enhanced Document Uploads table (replaces basic documents table)
CREATE TABLE IF NOT EXISTS document_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    application_id UUID,
    upload_batch_id UUID,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_category VARCHAR(100),
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_extension VARCHAR(20),
    file_hash VARCHAR(255),
    upload_status VARCHAR(50) DEFAULT 'uploaded' CHECK (upload_status IN ('uploading', 'uploaded', 'processing', 'verified', 'rejected', 'quarantined')),
    virus_scan_status VARCHAR(50) DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'scanning', 'clean', 'infected', 'suspicious')),
    virus_scan_timestamp TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMP,
    verification_notes TEXT,
    expiry_date DATE,
    expiry_reminder_sent BOOLEAN DEFAULT false,
    is_current_version BOOLEAN DEFAULT true,
    version_number INTEGER DEFAULT 1,
    replaced_by UUID,
    previous_version_id UUID,
    tags TEXT,
    metadata TEXT,
    ocr_extracted_text TEXT,
    ocr_processed BOOLEAN DEFAULT false,
    auto_categorized BOOLEAN DEFAULT false,
    categorization_confidence DECIMAL(5,2),
    access_level VARCHAR(50) DEFAULT 'private' CHECK (access_level IN ('private', 'internal', 'confidential', 'public')),
    access_log_enabled BOOLEAN DEFAULT true,
    retention_policy VARCHAR(100),
    deletion_scheduled_date DATE,
    is_encrypted BOOLEAN DEFAULT false,
    encryption_method VARCHAR(100),
    thumbnail_url TEXT,
    preview_available BOOLEAN DEFAULT false,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Document Access Logs table
CREATE TABLE IF NOT EXISTS document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    accessed_by UUID NOT NULL,
    access_type VARCHAR(50) CHECK (access_type IN ('view', 'download', 'edit', 'delete', 'share')),
    access_timestamp TIMESTAMP NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    access_granted BOOLEAN DEFAULT true,
    denial_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Document Batch Uploads table
CREATE TABLE IF NOT EXISTS document_batch_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name VARCHAR(255),
    total_files INTEGER NOT NULL,
    uploaded_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    batch_status VARCHAR(50) DEFAULT 'in_progress' CHECK (batch_status IN ('in_progress', 'completed', 'partial', 'failed')),
    uploaded_by UUID NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_log TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_uploads_employee_id ON document_uploads(employee_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_application_id ON document_uploads(application_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_batch_id ON document_uploads(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_type ON document_uploads(document_type);
CREATE INDEX IF NOT EXISTS idx_document_uploads_status ON document_uploads(upload_status);
CREATE INDEX IF NOT EXISTS idx_document_uploads_expiry ON document_uploads(expiry_date);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_accessed_by ON document_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_document_batch_uploads_uploaded_by ON document_batch_uploads(uploaded_by);

-- Enable RLS
ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_batch_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_uploads
CREATE POLICY "Allow read for authenticated users" ON document_uploads
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON document_uploads
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON document_uploads
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow delete for service role" ON document_uploads
    FOR DELETE USING (auth.role() = 'service_role');

-- RLS Policies for document_access_logs
CREATE POLICY "Allow read for authenticated users" ON document_access_logs
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON document_access_logs
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- RLS Policies for document_batch_uploads
CREATE POLICY "Allow read for authenticated users" ON document_batch_uploads
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));

CREATE POLICY "Allow insert via edge function" ON document_batch_uploads
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow update via edge function" ON document_batch_uploads
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));
