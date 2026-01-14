-- Migration: add_home_office_compliance_tables_part2
-- Created at: 1762967421

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

-- Ensure all required columns exist if table already existed (defensive)
ALTER TABLE compliance_alerts ADD COLUMN IF NOT EXISTS employee_id UUID;
ALTER TABLE compliance_alerts ADD COLUMN IF NOT EXISTS alert_type VARCHAR(100);
ALTER TABLE compliance_alerts ADD COLUMN IF NOT EXISTS alert_priority VARCHAR(50);
ALTER TABLE compliance_alerts ADD COLUMN IF NOT EXISTS alert_title VARCHAR(255);
ALTER TABLE compliance_alerts ADD COLUMN IF NOT EXISTS alert_message TEXT;
ALTER TABLE compliance_alerts ADD COLUMN IF NOT EXISTS alert_date DATE;
ALTER TABLE compliance_alerts ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE compliance_alerts ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE compliance_alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE compliance_alerts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();


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

CREATE INDEX IF NOT EXISTS idx_compliance_alerts_employee_id ON compliance_alerts(employee_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_status ON compliance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_due_date ON compliance_alerts(due_date);
CREATE INDEX IF NOT EXISTS idx_audit_packs_generated_date ON audit_packs(generated_date);
CREATE INDEX IF NOT EXISTS idx_home_office_forms_employee_id ON home_office_forms(employee_id);

ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_office_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON compliance_alerts FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON compliance_alerts FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON compliance_alerts FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow delete for service role" ON compliance_alerts FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Allow read for authenticated users" ON audit_packs FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON audit_packs FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON audit_packs FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow read for authenticated users" ON home_office_forms FOR SELECT USING (auth.role() IN ('authenticated', 'anon', 'service_role'));
CREATE POLICY "Allow insert via edge function" ON home_office_forms FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));
CREATE POLICY "Allow update via edge function" ON home_office_forms FOR UPDATE USING (auth.role() IN ('anon', 'service_role'));;