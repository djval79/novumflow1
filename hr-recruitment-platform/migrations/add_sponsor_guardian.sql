-- Migration: Sponsor Guardian - Visa & Right-to-Work Tracking
-- For UK healthcare organizations managing sponsored workers

-- Main table for sponsored workers
CREATE TABLE IF NOT EXISTS sponsored_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Personal Details
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    nationality TEXT,
    date_of_birth DATE,
    
    -- Visa Details
    visa_type TEXT NOT NULL, -- e.g., 'Skilled Worker', 'Health and Care Worker', 'Student', 'Other'
    visa_number TEXT,
    visa_start_date DATE,
    visa_expiry_date DATE NOT NULL,
    cos_number TEXT, -- Certificate of Sponsorship number
    cos_expiry_date DATE,
    
    -- Right to Work
    rtw_check_date DATE, -- Last right-to-work check date
    rtw_next_check_date DATE, -- When next check is due
    rtw_check_type TEXT, -- 'manual', 'online_share_code', 'employer_checking_service'
    rtw_verified_by UUID REFERENCES auth.users(id),
    
    -- Employment Status
    job_title TEXT,
    department TEXT,
    start_date DATE,
    end_date DATE,
    sponsorship_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'ending', 'ended', 'withdrawn'
    
    -- SMS Reporting (Home Office)
    last_sms_report_date DATE,
    sms_reports_required TEXT[], -- Array of required report types
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Table for tracking reportable changes (Home Office SMS)
CREATE TABLE IF NOT EXISTS sponsor_reportable_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES sponsored_workers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    change_type TEXT NOT NULL, -- 'absence', 'role_change', 'salary_change', 'end_of_employment', 'address_change', 'other'
    change_date DATE NOT NULL,
    description TEXT NOT NULL,
    
    -- Reporting
    reported_to_home_office BOOLEAN NOT NULL DEFAULT FALSE,
    reported_date DATE,
    reported_by UUID REFERENCES auth.users(id),
    reference_number TEXT, -- Home Office reference if applicable
    
    -- Deadline
    reporting_deadline DATE NOT NULL, -- Must report within 10 working days typically
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Table for compliance alerts
CREATE TABLE IF NOT EXISTS sponsor_compliance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES sponsored_workers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    alert_type TEXT NOT NULL, -- 'visa_expiry', 'rtw_check_due', 'cos_expiry', 'report_overdue', 'document_missing'
    severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sponsored_workers_tenant ON sponsored_workers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_workers_employee ON sponsored_workers(employee_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_workers_visa_expiry ON sponsored_workers(visa_expiry_date);
CREATE INDEX IF NOT EXISTS idx_sponsored_workers_status ON sponsored_workers(sponsorship_status);
CREATE INDEX IF NOT EXISTS idx_reportable_changes_worker ON sponsor_reportable_changes(worker_id);
CREATE INDEX IF NOT EXISTS idx_reportable_changes_deadline ON sponsor_reportable_changes(reporting_deadline);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_tenant ON sponsor_compliance_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_status ON sponsor_compliance_alerts(status);

-- RLS Policies
ALTER TABLE sponsored_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_reportable_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_compliance_alerts ENABLE ROW LEVEL SECURITY;

-- Sponsored Workers policies
CREATE POLICY "Tenant users can view sponsored workers"
ON sponsored_workers FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage sponsored workers"
ON sponsored_workers FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Reportable Changes policies
CREATE POLICY "Tenant users can view reportable changes"
ON sponsor_reportable_changes FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage reportable changes"
ON sponsor_reportable_changes FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Compliance Alerts policies
CREATE POLICY "Tenant users can view compliance alerts"
ON sponsor_compliance_alerts FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage compliance alerts"
ON sponsor_compliance_alerts FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Function to auto-generate compliance alerts
CREATE OR REPLACE FUNCTION generate_sponsor_compliance_alerts()
RETURNS void AS $$
DECLARE
    worker RECORD;
    alert_exists BOOLEAN;
BEGIN
    -- Loop through all active sponsored workers
    FOR worker IN 
        SELECT * FROM sponsored_workers 
        WHERE sponsorship_status = 'active'
    LOOP
        -- Visa expiry alerts (90, 60, 30, 14 days)
        IF worker.visa_expiry_date IS NOT NULL THEN
            -- 90 days
            IF worker.visa_expiry_date - CURRENT_DATE <= 90 AND worker.visa_expiry_date > CURRENT_DATE THEN
                SELECT EXISTS(
                    SELECT 1 FROM sponsor_compliance_alerts 
                    WHERE worker_id = worker.id 
                    AND alert_type = 'visa_expiry' 
                    AND status = 'active'
                ) INTO alert_exists;
                
                IF NOT alert_exists THEN
                    INSERT INTO sponsor_compliance_alerts (worker_id, tenant_id, alert_type, severity, title, description, due_date)
                    VALUES (
                        worker.id,
                        worker.tenant_id,
                        'visa_expiry',
                        CASE 
                            WHEN worker.visa_expiry_date - CURRENT_DATE <= 14 THEN 'critical'
                            WHEN worker.visa_expiry_date - CURRENT_DATE <= 30 THEN 'high'
                            WHEN worker.visa_expiry_date - CURRENT_DATE <= 60 THEN 'medium'
                            ELSE 'low'
                        END,
                        worker.first_name || ' ' || worker.last_name || '''s visa expires soon',
                        'Visa expires on ' || to_char(worker.visa_expiry_date, 'DD Mon YYYY') || '. ' ||
                        (worker.visa_expiry_date - CURRENT_DATE) || ' days remaining.',
                        worker.visa_expiry_date
                    );
                END IF;
            END IF;
        END IF;
        
        -- RTW check due alerts
        IF worker.rtw_next_check_date IS NOT NULL AND worker.rtw_next_check_date - CURRENT_DATE <= 30 THEN
            SELECT EXISTS(
                SELECT 1 FROM sponsor_compliance_alerts 
                WHERE worker_id = worker.id 
                AND alert_type = 'rtw_check_due' 
                AND status = 'active'
            ) INTO alert_exists;
            
            IF NOT alert_exists THEN
                INSERT INTO sponsor_compliance_alerts (worker_id, tenant_id, alert_type, severity, title, description, due_date)
                VALUES (
                    worker.id,
                    worker.tenant_id,
                    'rtw_check_due',
                    CASE 
                        WHEN worker.rtw_next_check_date <= CURRENT_DATE THEN 'critical'
                        WHEN worker.rtw_next_check_date - CURRENT_DATE <= 7 THEN 'high'
                        ELSE 'medium'
                    END,
                    'Right to Work check due for ' || worker.first_name || ' ' || worker.last_name,
                    'RTW check is due on ' || to_char(worker.rtw_next_check_date, 'DD Mon YYYY'),
                    worker.rtw_next_check_date
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON sponsored_workers TO service_role;
GRANT ALL ON sponsor_reportable_changes TO service_role;
GRANT ALL ON sponsor_compliance_alerts TO service_role;
