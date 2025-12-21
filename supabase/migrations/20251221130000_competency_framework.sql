-- ===========================================
-- Competency Framework Database Schema
-- CQC Regulation 18 & 19 Compliance
-- ===========================================
-- Created: 2025-12-21
-- Description: Tables for tracking staff competencies
--              with sign-off workflow support
-- ===========================================

-- Table: competency_records
-- Tracks individual competency assessments per employee
CREATE TABLE IF NOT EXISTS competency_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    
    -- Competency identification
    category_id VARCHAR(50) NOT NULL,
    standard_id VARCHAR(50) NOT NULL,
    standard_name VARCHAR(255) NOT NULL,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'pending_signoff', 'competent', 'expired', 'not_applicable')),
    
    -- Evidence capture
    evidence_type VARCHAR(50),
    evidence_notes TEXT,
    evidence_document_id UUID,
    
    -- Assessment details
    assessed_by UUID,
    assessed_at TIMESTAMPTZ,
    assessor_role VARCHAR(100),
    
    -- Sign-off workflow
    signed_off_by UUID,
    signed_off_at TIMESTAMPTZ,
    signoff_notes TEXT,
    
    -- Validity period (for competencies that expire)
    valid_from DATE,
    valid_until DATE,
    requires_renewal BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique competency per employee per standard
    UNIQUE (tenant_id, employee_id, category_id, standard_id)
);

-- Table: competency_templates
-- Defines which competencies are required for each role
CREATE TABLE IF NOT EXISTS competency_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Template details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    role_type VARCHAR(100) NOT NULL,
    
    -- Competency requirements (JSONB array of category:standard pairs)
    required_competencies JSONB NOT NULL DEFAULT '[]',
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    auto_assign_on_hire BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    UNIQUE (tenant_id, role_type)
);

-- Table: competency_renewals
-- Tracks renewal requirements and notifications
CREATE TABLE IF NOT EXISTS competency_renewals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    competency_record_id UUID NOT NULL REFERENCES competency_records(id) ON DELETE CASCADE,
    
    -- Renewal details
    original_expiry DATE NOT NULL,
    renewal_due_date DATE NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending'
        CHECK (status IN ('pending', 'notified', 'completed', 'overdue')),
    
    -- Notifications sent
    first_notification_sent_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    escalation_sent_at TIMESTAMPTZ,
    
    -- Completion
    renewed_at TIMESTAMPTZ,
    renewed_by UUID,
    new_record_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_competency_records_tenant 
    ON competency_records(tenant_id);

CREATE INDEX IF NOT EXISTS idx_competency_records_employee 
    ON competency_records(tenant_id, employee_id);

CREATE INDEX IF NOT EXISTS idx_competency_records_status 
    ON competency_records(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_competency_records_expiry 
    ON competency_records(tenant_id, valid_until) 
    WHERE valid_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_competency_templates_role 
    ON competency_templates(tenant_id, role_type);

CREATE INDEX IF NOT EXISTS idx_competency_renewals_due 
    ON competency_renewals(renewal_due_date, status);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE competency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_renewals ENABLE ROW LEVEL SECURITY;

-- Policies for competency_records
CREATE POLICY "Users can view competency records in their tenant"
    ON competency_records FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Managers can insert competency records"
    ON competency_records FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Managers can update competency records"
    ON competency_records FOR UPDATE
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Policies for competency_templates
CREATE POLICY "Users can view competency templates in their tenant"
    ON competency_templates FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Admins can manage competency templates"
    ON competency_templates FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Policies for competency_renewals
CREATE POLICY "Users can view competency renewals in their tenant"
    ON competency_renewals FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "System can manage competency renewals"
    ON competency_renewals FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to get employee competency completion summary
CREATE OR REPLACE FUNCTION get_employee_competency_summary(
    p_tenant_id UUID,
    p_employee_id UUID,
    p_role_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    total_required INTEGER,
    completed INTEGER,
    in_progress INTEGER,
    pending_signoff INTEGER,
    expired INTEGER,
    completion_percentage INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH required_comps AS (
        SELECT jsonb_array_elements_text(required_competencies) as comp_id
        FROM competency_templates
        WHERE tenant_id = p_tenant_id
        AND (p_role_type IS NULL OR role_type = p_role_type)
        AND is_active = true
    ),
    employee_comps AS (
        SELECT category_id || ':' || standard_id as comp_id, status
        FROM competency_records
        WHERE tenant_id = p_tenant_id
        AND employee_id = p_employee_id
    )
    SELECT 
        COALESCE(COUNT(DISTINCT rc.comp_id), 0)::INTEGER as total_required,
        COALESCE(SUM(CASE WHEN ec.status = 'competent' THEN 1 ELSE 0 END), 0)::INTEGER as completed,
        COALESCE(SUM(CASE WHEN ec.status = 'in_progress' THEN 1 ELSE 0 END), 0)::INTEGER as in_progress,
        COALESCE(SUM(CASE WHEN ec.status = 'pending_signoff' THEN 1 ELSE 0 END), 0)::INTEGER as pending_signoff,
        COALESCE(SUM(CASE WHEN ec.status = 'expired' THEN 1 ELSE 0 END), 0)::INTEGER as expired,
        CASE 
            WHEN COUNT(DISTINCT rc.comp_id) = 0 THEN 100
            ELSE (COALESCE(SUM(CASE WHEN ec.status = 'competent' THEN 1 ELSE 0 END), 0) * 100 / 
                  COUNT(DISTINCT rc.comp_id))::INTEGER
        END as completion_percentage
    FROM required_comps rc
    LEFT JOIN employee_comps ec ON rc.comp_id = ec.comp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for expiring competencies
CREATE OR REPLACE FUNCTION get_expiring_competencies(
    p_tenant_id UUID,
    p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
    record_id UUID,
    employee_id UUID,
    category_id VARCHAR,
    standard_id VARCHAR,
    standard_name VARCHAR,
    valid_until DATE,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id,
        cr.employee_id,
        cr.category_id,
        cr.standard_id,
        cr.standard_name,
        cr.valid_until,
        (cr.valid_until - CURRENT_DATE)::INTEGER as days_until_expiry
    FROM competency_records cr
    WHERE cr.tenant_id = p_tenant_id
    AND cr.status = 'competent'
    AND cr.valid_until IS NOT NULL
    AND cr.valid_until <= CURRENT_DATE + p_days_ahead
    ORDER BY cr.valid_until ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE competency_records IS 'Tracks individual staff competency achievements with sign-off workflow for CQC compliance';
COMMENT ON TABLE competency_templates IS 'Defines required competencies per role type';
COMMENT ON TABLE competency_renewals IS 'Manages competency renewal tracking and notifications';

COMMENT ON COLUMN competency_records.evidence_type IS 'Type of evidence: observation, written_test, practical_assessment, certificate, training_completion, self_declaration, supervisor_signoff';
COMMENT ON COLUMN competency_records.status IS 'Current status: not_started, in_progress, pending_signoff, competent, expired, not_applicable';
