-- Migration: add_biometric_tables
-- Created at: 1762967482

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

CREATE INDEX IF NOT EXISTS idx_biometric_enrollment_employee_id ON biometric_enrollment(employee_id);
CREATE INDEX IF NOT EXISTS idx_biometric_attendance_employee_id ON biometric_attendance_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_biometric_attendance_timestamp ON biometric_attendance_logs(log_timestamp);
CREATE INDEX IF NOT EXISTS idx_biometric_verification_employee_id ON biometric_verification_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_biometric_verification_timestamp ON biometric_verification_logs(verification_timestamp);
CREATE INDEX IF NOT EXISTS idx_biometric_security_events_timestamp ON biometric_security_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_biometric_security_events_severity ON biometric_security_events(severity_level);

ALTER TABLE biometric_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON biometric_enrollment FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON biometric_enrollment FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON biometric_enrollment FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow delete for service role" ON biometric_enrollment FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Allow read for authenticated users" ON biometric_attendance_logs FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON biometric_attendance_logs FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow read for authenticated users" ON biometric_verification_logs FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON biometric_verification_logs FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow read for authenticated users" ON biometric_security_events FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON biometric_security_events FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON biometric_security_events FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));;