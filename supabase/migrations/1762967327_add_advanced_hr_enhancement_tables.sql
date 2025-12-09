-- Migration: add_advanced_hr_enhancement_tables
-- Created at: 1762967327
-- 'references' table removed as it caused syntax error (reserved keyword) and is correctly created as 'applicant_references' in 1762967379_add_applicant_references_table.sql


-- DBS Certificates tables
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

CREATE INDEX IF NOT EXISTS idx_dbs_certificates_employee_id ON dbs_certificates(employee_id);
CREATE INDEX IF NOT EXISTS idx_dbs_certificates_application_id ON dbs_certificates(application_id);
CREATE INDEX IF NOT EXISTS idx_dbs_certificates_status ON dbs_certificates(status);
CREATE INDEX IF NOT EXISTS idx_dbs_certificates_expiry_date ON dbs_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_dbs_verification_logs_certificate_id ON dbs_verification_logs(dbs_certificate_id);
CREATE INDEX IF NOT EXISTS idx_dbs_compliance_records_employee_id ON dbs_compliance_records(employee_id);

ALTER TABLE dbs_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dbs_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dbs_compliance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON dbs_certificates
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON dbs_certificates
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON dbs_certificates
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow delete for service role" ON dbs_certificates
    FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Allow read for authenticated users" ON dbs_verification_logs
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON dbs_verification_logs
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow read for authenticated users" ON dbs_compliance_records
    FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON dbs_compliance_records
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON dbs_compliance_records
    FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));;