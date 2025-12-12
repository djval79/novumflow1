-- ===========================================
-- COMPREHENSIVE COMPLIANCE DATABASE SCHEMA
-- NovumFlow & CareFlow Suite
-- ===========================================
-- This schema tracks compliance from application through employment
-- Separates Home Office and CQC compliance with clear document categorization
-- 
-- STANDALONE VERSION - No external table dependencies
-- Can be run independently on any Supabase project
-- ===========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- PREREQUISITE: TENANTS TABLE
-- ===========================================
-- Create minimal tenants table if it doesn't exist
-- This ensures the schema works on a fresh database

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    subdomain TEXT UNIQUE,
    logo_url TEXT,
    website TEXT,
    primary_email TEXT,
    phone TEXT,
    address JSONB,
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{
        "novumflow_enabled": true,
        "careflow_enabled": true,
        "ai_enabled": false
    }',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a default tenant if none exists (for testing/demo)
INSERT INTO tenants (id, name, slug, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Default Organization',
    'default',
    true
)
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- ENUM TYPES (with IF NOT EXISTS pattern)
-- ===========================================

-- Drop and recreate enums to avoid conflicts
DO $$ 
BEGIN
    -- Compliance authority types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_authority') THEN
        CREATE TYPE compliance_authority AS ENUM (
            'HOME_OFFICE',
            'CQC', 
            'BOTH',
            'INTERNAL'
        );
    END IF;

    -- Employment lifecycle stages
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_stage') THEN
        CREATE TYPE compliance_stage AS ENUM (
            'APPLICATION',
            'PRE_EMPLOYMENT',
            'ONBOARDING',
            'ONGOING',
            'OFFBOARDING'
        );
    END IF;

    -- Document status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM (
            'PENDING',
            'UPLOADED',
            'UNDER_REVIEW',
            'VERIFIED',
            'REJECTED',
            'EXPIRED',
            'EXPIRING_SOON',
            'NOT_APPLICABLE'
        );
    END IF;

    -- Urgency levels for alerts
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgency_level') THEN
        CREATE TYPE urgency_level AS ENUM (
            'CRITICAL',
            'HIGH',
            'MEDIUM',
            'LOW'
        );
    END IF;

    -- Person type (tracks through their journey)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_person_type') THEN
        CREATE TYPE compliance_person_type AS ENUM (
            'APPLICANT',
            'CANDIDATE',
            'NEW_HIRE',
            'EMPLOYEE',
            'FORMER_EMPLOYEE'
        );
    END IF;
END $$;

-- ===========================================
-- CORE TABLES
-- ===========================================

-- Main person tracking table (unified across applicant to employee)
-- This is STANDALONE - does not reference applicants or employees tables
CREATE TABLE IF NOT EXISTS compliance_persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- External references (optional - for integration with existing HR tables)
    external_applicant_id UUID,
    external_employee_id UUID,
    
    -- Person details
    person_type compliance_person_type NOT NULL DEFAULT 'APPLICANT',
    current_stage compliance_stage NOT NULL DEFAULT 'APPLICATION',
    
    -- Personal info
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    nationality VARCHAR(100),
    
    -- Immigration status (for Home Office)
    has_indefinite_leave BOOLEAN DEFAULT FALSE,
    visa_type VARCHAR(100),
    visa_expiry_date DATE,
    share_code VARCHAR(50),
    brp_number VARCHAR(50),
    national_insurance_number VARCHAR(20),
    
    -- Role info (for CQC requirements)
    job_title VARCHAR(255),
    department VARCHAR(100),
    requires_nmc BOOLEAN DEFAULT FALSE,
    nmc_pin VARCHAR(50),
    nmc_expiry_date DATE,
    
    -- Compliance scores
    overall_compliance_score INTEGER DEFAULT 0,
    home_office_score INTEGER DEFAULT 0,
    cqc_score INTEGER DEFAULT 0,
    compliance_status VARCHAR(50) DEFAULT 'PENDING',
    
    -- Dates
    application_date TIMESTAMPTZ,
    offer_date TIMESTAMPTZ,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Sync status
    synced_to_careflow BOOLEAN DEFAULT FALSE,
    careflow_sync_date TIMESTAMPTZ,
    
    CONSTRAINT unique_compliance_person_per_tenant UNIQUE (tenant_id, email)
);

-- ===========================================
-- DOCUMENT MANAGEMENT TABLES
-- ===========================================

-- Document types master table
CREATE TABLE IF NOT EXISTS compliance_document_types (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    authority compliance_authority NOT NULL,
    stages compliance_stage[] NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    has_expiry BOOLEAN DEFAULT FALSE,
    expiry_warning_days INTEGER,
    renewal_period_months INTEGER,
    verification_required BOOLEAN DEFAULT TRUE,
    accepted_formats TEXT[],
    max_size_mb INTEGER DEFAULT 10,
    conditional_on VARCHAR(100),
    home_office_relevance TEXT,
    cqc_relevance TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Person documents (actual uploaded documents)
CREATE TABLE IF NOT EXISTS compliance_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    person_id UUID NOT NULL REFERENCES compliance_persons(id) ON DELETE CASCADE,
    document_type_id VARCHAR(100) NOT NULL REFERENCES compliance_document_types(id),
    
    -- Document details
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Status tracking
    status document_status NOT NULL DEFAULT 'UPLOADED',
    authority compliance_authority NOT NULL,
    applicable_stages compliance_stage[],
    
    -- Dates
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    issue_date DATE,
    expiry_date DATE,
    verified_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    
    -- Verification
    verified_by UUID,
    rejection_reason TEXT,
    verification_notes TEXT,
    
    -- Version control
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT TRUE,
    previous_version_id UUID REFERENCES compliance_documents(id),
    
    -- Auto-classification results
    auto_classified BOOLEAN DEFAULT FALSE,
    classification_confidence DECIMAL(5,2),
    detected_expiry_date DATE,
    extracted_data JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    -- Storage bucket reference
    storage_bucket VARCHAR(100),
    storage_path TEXT
);

-- ===========================================
-- FOLDER STRUCTURE TABLES
-- ===========================================

-- Virtual folders for organizing documents
CREATE TABLE IF NOT EXISTS compliance_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Folder hierarchy
    parent_folder_id UUID REFERENCES compliance_folders(id),
    
    -- Folder details
    name VARCHAR(255) NOT NULL,
    authority compliance_authority NOT NULL,
    color VARCHAR(20),
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    
    -- Auto-assign rules (document types that auto-go to this folder)
    auto_assign_document_types VARCHAR(100)[],
    
    -- System folder flag (cannot be deleted)
    is_system_folder BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document-folder assignments
CREATE TABLE IF NOT EXISTS compliance_document_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES compliance_documents(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES compliance_folders(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID,
    
    CONSTRAINT unique_doc_folder UNIQUE (document_id, folder_id)
);

-- ===========================================
-- COMPLIANCE TRACKING TABLES
-- ===========================================

-- Compliance checklist items per person
CREATE TABLE IF NOT EXISTS compliance_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    person_id UUID NOT NULL REFERENCES compliance_persons(id) ON DELETE CASCADE,
    document_type_id VARCHAR(100) NOT NULL REFERENCES compliance_document_types(id),
    
    -- Status
    status document_status NOT NULL DEFAULT 'PENDING',
    is_required BOOLEAN DEFAULT TRUE,
    is_applicable BOOLEAN DEFAULT TRUE,
    
    -- For the specific stage
    stage compliance_stage NOT NULL,
    authority compliance_authority NOT NULL,
    
    -- Linked document (when uploaded)
    document_id UUID REFERENCES compliance_documents(id),
    
    -- Due date (calculated based on requirements)
    due_date DATE,
    completed_date DATE,
    
    -- Notes
    notes TEXT,
    waiver_reason TEXT,
    waived_by UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_checklist_item UNIQUE (person_id, document_type_id, stage)
);

-- Stage progression tracking
CREATE TABLE IF NOT EXISTS compliance_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    person_id UUID NOT NULL REFERENCES compliance_persons(id) ON DELETE CASCADE,
    
    from_stage compliance_stage,
    to_stage compliance_stage NOT NULL,
    
    -- Progress details
    auto_progressed BOOLEAN DEFAULT FALSE,
    progressed_by UUID,
    progress_reason TEXT,
    
    -- Compliance state at transition
    compliance_score_at_transition INTEGER,
    missing_documents TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- AUTOMATION TABLES
-- ===========================================

-- Scheduled compliance tasks
CREATE TABLE IF NOT EXISTS compliance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    person_id UUID REFERENCES compliance_persons(id) ON DELETE CASCADE,
    document_id UUID REFERENCES compliance_documents(id) ON DELETE CASCADE,
    
    -- Task details
    task_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    urgency urgency_level NOT NULL DEFAULT 'MEDIUM',
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    
    -- Assignment
    assigned_to UUID,
    assigned_at TIMESTAMPTZ,
    
    -- Automation
    is_automated BOOLEAN DEFAULT FALSE,
    automation_trigger VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification/reminder history
CREATE TABLE IF NOT EXISTS compliance_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    person_id UUID REFERENCES compliance_persons(id),
    document_id UUID REFERENCES compliance_documents(id),
    task_id UUID REFERENCES compliance_tasks(id),
    
    -- Notification details
    notification_type VARCHAR(100) NOT NULL,
    urgency urgency_level NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT,
    
    -- Recipients
    recipients JSONB, -- Array of {user_id, email, role}
    
    -- Delivery status
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    -- Channels used
    email_sent BOOLEAN DEFAULT FALSE,
    in_app_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- CROSS-APP SYNC TABLES
-- ===========================================

-- Sync log between NovumFlow and CareFlow
CREATE TABLE IF NOT EXISTS compliance_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Sync details
    source_app VARCHAR(50) NOT NULL, -- 'novumflow' or 'careflow'
    target_app VARCHAR(50) NOT NULL,
    sync_type VARCHAR(100) NOT NULL, -- 'person', 'document', 'folder', etc.
    
    -- Entity reference
    source_entity_id UUID NOT NULL,
    target_entity_id UUID,
    entity_type VARCHAR(100) NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    sync_started_at TIMESTAMPTZ,
    sync_completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Data snapshot
    sync_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- AUDIT TABLES
-- ===========================================

-- Compliance audit trail
CREATE TABLE IF NOT EXISTS compliance_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- User info
    user_id UUID,
    user_email VARCHAR(255),
    user_role VARCHAR(100),
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address VARCHAR(50),
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- VIEWS FOR REPORTING
-- ===========================================

-- Comprehensive compliance status view
CREATE OR REPLACE VIEW v_compliance_status AS
SELECT 
    cp.id AS person_id,
    cp.tenant_id,
    cp.full_name,
    cp.email,
    cp.person_type,
    cp.current_stage,
    cp.overall_compliance_score,
    cp.home_office_score,
    cp.cqc_score,
    cp.compliance_status,
    
    -- Document counts
    COUNT(cd.id) AS total_documents,
    COUNT(cd.id) FILTER (WHERE cd.status = 'VERIFIED') AS verified_documents,
    COUNT(cd.id) FILTER (WHERE cd.status = 'PENDING') AS pending_documents,
    COUNT(cd.id) FILTER (WHERE cd.status = 'EXPIRED') AS expired_documents,
    COUNT(cd.id) FILTER (WHERE cd.status = 'EXPIRING_SOON') AS expiring_soon_documents,
    
    -- Authority breakdown
    COUNT(cd.id) FILTER (WHERE cd.authority = 'HOME_OFFICE') AS home_office_docs,
    COUNT(cd.id) FILTER (WHERE cd.authority = 'CQC') AS cqc_docs,
    COUNT(cd.id) FILTER (WHERE cd.authority = 'BOTH') AS shared_docs,
    
    cp.created_at,
    cp.updated_at

FROM compliance_persons cp
LEFT JOIN compliance_documents cd ON cd.person_id = cp.id AND cd.is_current = true
GROUP BY cp.id;

-- Expiring documents view
CREATE OR REPLACE VIEW v_expiring_documents AS
SELECT 
    cd.id AS document_id,
    cd.tenant_id,
    cp.id AS person_id,
    cp.full_name,
    cp.email,
    cdt.name AS document_type,
    cd.authority,
    cd.expiry_date,
    (cd.expiry_date - CURRENT_DATE) AS days_until_expiry,
    CASE 
        WHEN cd.expiry_date <= CURRENT_DATE THEN 'CRITICAL'
        WHEN cd.expiry_date <= CURRENT_DATE + 7 THEN 'HIGH'
        WHEN cd.expiry_date <= CURRENT_DATE + 30 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS urgency,
    cd.status
FROM compliance_documents cd
JOIN compliance_persons cp ON cp.id = cd.person_id
JOIN compliance_document_types cdt ON cdt.id = cd.document_type_id
WHERE cd.is_current = true
    AND cd.expiry_date IS NOT NULL
    AND cd.expiry_date <= CURRENT_DATE + 90
ORDER BY cd.expiry_date ASC;

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_compliance_persons_tenant ON compliance_persons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_persons_stage ON compliance_persons(current_stage);
CREATE INDEX IF NOT EXISTS idx_compliance_persons_email ON compliance_persons(email);
CREATE INDEX IF NOT EXISTS idx_compliance_persons_status ON compliance_persons(compliance_status);

CREATE INDEX IF NOT EXISTS idx_compliance_documents_person ON compliance_documents(person_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_type ON compliance_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_status ON compliance_documents(status);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_expiry ON compliance_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_authority ON compliance_documents(authority);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_current ON compliance_documents(is_current);

CREATE INDEX IF NOT EXISTS idx_compliance_checklists_person ON compliance_checklists(person_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checklists_stage ON compliance_checklists(stage);
CREATE INDEX IF NOT EXISTS idx_compliance_checklists_status ON compliance_checklists(status);

CREATE INDEX IF NOT EXISTS idx_compliance_tasks_person ON compliance_tasks(person_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_status ON compliance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_due ON compliance_tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_compliance_folders_tenant ON compliance_folders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_folders_authority ON compliance_folders(authority);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_entity ON compliance_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_user ON compliance_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_compliance_sync_log_tenant ON compliance_sync_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_sync_log_status ON compliance_sync_log(status);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE compliance_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_sync_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "compliance_persons_select" ON compliance_persons;
DROP POLICY IF EXISTS "compliance_persons_all" ON compliance_persons;
DROP POLICY IF EXISTS "compliance_documents_select" ON compliance_documents;
DROP POLICY IF EXISTS "compliance_documents_all" ON compliance_documents;

-- RLS Policies - using tenant_id directly (simpler approach)
-- In production, you would join to user_tenant_memberships

-- Anyone authenticated can read compliance data for their tenant
CREATE POLICY "compliance_persons_select" ON compliance_persons
    FOR SELECT USING (true);  -- Simplified for demo; use tenant check in production

CREATE POLICY "compliance_persons_all" ON compliance_persons
    FOR ALL USING (true);  -- Simplified for demo

CREATE POLICY "compliance_documents_select" ON compliance_documents
    FOR SELECT USING (true);

CREATE POLICY "compliance_documents_all" ON compliance_documents
    FOR ALL USING (true);

CREATE POLICY "compliance_checklists_all" ON compliance_checklists
    FOR ALL USING (true);

CREATE POLICY "compliance_folders_all" ON compliance_folders
    FOR ALL USING (true);

CREATE POLICY "compliance_tasks_all" ON compliance_tasks
    FOR ALL USING (true);

CREATE POLICY "compliance_notifications_all" ON compliance_notifications
    FOR ALL USING (true);

CREATE POLICY "compliance_audit_log_all" ON compliance_audit_log
    FOR ALL USING (true);

CREATE POLICY "compliance_sync_log_all" ON compliance_sync_log
    FOR ALL USING (true);

-- ===========================================
-- FUNCTIONS FOR AUTOMATION
-- ===========================================

-- Function to calculate compliance score
CREATE OR REPLACE FUNCTION calculate_compliance_score(p_person_id UUID)
RETURNS TABLE (
    overall_score INTEGER,
    home_office_score INTEGER,
    cqc_score INTEGER,
    compliance_status VARCHAR(50)
) AS $$
DECLARE
    v_ho_required INTEGER;
    v_ho_verified INTEGER;
    v_cqc_required INTEGER;
    v_cqc_verified INTEGER;
    v_expired INTEGER;
    v_expiring INTEGER;
    v_overall INTEGER;
    v_ho INTEGER;
    v_cqc INTEGER;
    v_status VARCHAR(50);
BEGIN
    -- Count Home Office documents (using table alias to avoid ambiguity)
    SELECT 
        COUNT(*) FILTER (WHERE cl.is_required = true),
        COUNT(*) FILTER (WHERE cl.status = 'VERIFIED')
    INTO v_ho_required, v_ho_verified
    FROM compliance_checklists cl
    WHERE cl.person_id = p_person_id AND cl.authority IN ('HOME_OFFICE', 'BOTH');
    
    -- Count CQC documents
    SELECT 
        COUNT(*) FILTER (WHERE cl.is_required = true),
        COUNT(*) FILTER (WHERE cl.status = 'VERIFIED')
    INTO v_cqc_required, v_cqc_verified
    FROM compliance_checklists cl
    WHERE cl.person_id = p_person_id AND cl.authority IN ('CQC', 'BOTH');
    
    -- Count expired and expiring documents
    SELECT 
        COUNT(*) FILTER (WHERE cd.status = 'EXPIRED'),
        COUNT(*) FILTER (WHERE cd.status = 'EXPIRING_SOON')
    INTO v_expired, v_expiring
    FROM compliance_documents cd
    WHERE cd.person_id = p_person_id AND cd.is_current = true;
    
    -- Calculate scores
    v_ho := CASE WHEN v_ho_required > 0 
        THEN ROUND((v_ho_verified::DECIMAL / v_ho_required) * 100)::INTEGER 
        ELSE 100 END;
        
    v_cqc := CASE WHEN v_cqc_required > 0 
        THEN ROUND((v_cqc_verified::DECIMAL / v_cqc_required) * 100)::INTEGER 
        ELSE 100 END;
        
    v_overall := ROUND((v_ho + v_cqc) / 2.0)::INTEGER;
    
    -- Determine status
    v_status := CASE 
        WHEN v_expired > 0 THEN 'NON_COMPLIANT'
        WHEN v_expiring > 0 OR v_overall < 80 THEN 'AT_RISK'
        ELSE 'COMPLIANT'
    END;
    
    overall_score := v_overall;
    home_office_score := v_ho;
    cqc_score := v_cqc;
    compliance_status := v_status;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update expiring documents
CREATE OR REPLACE FUNCTION check_document_expiries()
RETURNS INTEGER AS $$
DECLARE
    v_updated INTEGER := 0;
BEGIN
    -- Mark expired documents
    UPDATE compliance_documents
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE expiry_date < CURRENT_DATE
    AND status NOT IN ('EXPIRED', 'NOT_APPLICABLE')
    AND is_current = true;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    -- Mark expiring soon documents (within 30 days)
    UPDATE compliance_documents
    SET status = 'EXPIRING_SOON', updated_at = NOW()
    WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
    AND status = 'VERIFIED'
    AND is_current = true;
    
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update compliance scores on document changes
CREATE OR REPLACE FUNCTION update_compliance_on_document_change()
RETURNS TRIGGER AS $$
DECLARE
    v_scores RECORD;
    v_person_id UUID;
BEGIN
    v_person_id := COALESCE(NEW.person_id, OLD.person_id);
    
    IF v_person_id IS NOT NULL THEN
        -- Calculate new scores
        SELECT * INTO v_scores 
        FROM calculate_compliance_score(v_person_id);
        
        -- Update person record (using compliance_status from the function)
        UPDATE compliance_persons cp SET
            overall_compliance_score = v_scores.overall_score,
            home_office_score = v_scores.home_office_score,
            cqc_score = v_scores.cqc_score,
            compliance_status = v_scores.compliance_status,
            updated_at = NOW()
        WHERE cp.id = v_person_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_compliance_document_change ON compliance_documents;
CREATE TRIGGER trigger_compliance_document_change
AFTER INSERT OR UPDATE OR DELETE ON compliance_documents
FOR EACH ROW EXECUTE FUNCTION update_compliance_on_document_change();

-- ===========================================
-- SEED DEFAULT DOCUMENT TYPES
-- ===========================================

INSERT INTO compliance_document_types (id, name, description, authority, stages, is_required, has_expiry, expiry_warning_days, verification_required, accepted_formats, max_size_mb, sort_order)
VALUES 
    -- Home Office Documents
    ('rtw_passport', 'Passport', 'Valid passport showing right to work in UK', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT']::compliance_stage[], true, true, 90, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 10, 1),
    ('rtw_visa', 'Visa / Immigration Status', 'Valid visa or immigration document', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[], false, true, 90, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 10, 2),
    ('rtw_brp', 'Biometric Residence Permit (BRP)', 'BRP card for non-UK nationals', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[], false, true, 90, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 10, 3),
    ('rtw_share_code', 'Home Office Share Code', 'Online right to work share code verification', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT']::compliance_stage[], false, true, 30, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 5, 4),
    ('rtw_check_result', 'Right to Work Check Result', 'Completed RTW check screenshot/confirmation', 'HOME_OFFICE', ARRAY['PRE_EMPLOYMENT']::compliance_stage[], true, false, null, false, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 5, 5),
    ('national_insurance', 'National Insurance Number', 'NI number letter or proof', 'HOME_OFFICE', ARRAY['PRE_EMPLOYMENT', 'ONBOARDING']::compliance_stage[], true, false, null, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 5, 6),
    ('birth_certificate', 'Birth Certificate', 'UK birth certificate (full)', 'HOME_OFFICE', ARRAY['APPLICATION', 'PRE_EMPLOYMENT']::compliance_stage[], false, false, null, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 10, 7),
    
    -- CQC Documents
    ('dbs_certificate', 'DBS Certificate (Enhanced)', 'Enhanced DBS certificate with barred list check', 'CQC', ARRAY['PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[], true, true, 90, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 10, 10),
    ('dbs_update_service', 'DBS Update Service Registration', 'DBS Update Service subscription confirmation', 'CQC', ARRAY['PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[], false, true, 30, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 5, 11),
    ('care_certificate', 'Care Certificate', 'Completed Care Certificate or commitment to complete', 'CQC', ARRAY['PRE_EMPLOYMENT', 'ONBOARDING']::compliance_stage[], true, false, null, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 10, 12),
    ('nvq_qualification', 'NVQ/QCF Health & Social Care', 'Level 2/3/4/5 qualification in Health & Social Care', 'CQC', ARRAY['APPLICATION', 'ONGOING']::compliance_stage[], false, false, null, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 10, 13),
    ('mandatory_training', 'Mandatory Training Certificates', 'All mandatory training certifications', 'CQC', ARRAY['ONBOARDING', 'ONGOING']::compliance_stage[], true, true, 30, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 20, 14),
    ('health_declaration', 'Health Declaration Form', 'Self-declaration of fitness to work', 'CQC', ARRAY['PRE_EMPLOYMENT']::compliance_stage[], true, false, null, false, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 5, 15),
    ('occupational_health', 'Occupational Health Clearance', 'OH assessment clearance for role', 'CQC', ARRAY['PRE_EMPLOYMENT']::compliance_stage[], false, false, null, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 10, 16),
    ('immunization_records', 'Immunization Records', 'Hepatitis B, TB, and other vaccinations', 'CQC', ARRAY['PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[], true, true, 60, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 10, 17),
    ('nmc_pin', 'NMC PIN Registration', 'Nursing & Midwifery Council registration', 'CQC', ARRAY['APPLICATION', 'PRE_EMPLOYMENT', 'ONGOING']::compliance_stage[], false, true, 90, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 5, 18),
    
    -- Shared Documents
    ('photo_id', 'Photo Identification', 'Photo ID for identity verification', 'BOTH', ARRAY['APPLICATION', 'PRE_EMPLOYMENT']::compliance_stage[], true, true, 90, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 10, 20),
    ('proof_of_address', 'Proof of Address', 'Utility bill or bank statement (within 3 months)', 'BOTH', ARRAY['APPLICATION', 'PRE_EMPLOYMENT']::compliance_stage[], true, true, 30, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 5, 21),
    ('employment_references', 'Employment References', 'Professional references (minimum 2, covering 5 years)', 'BOTH', ARRAY['PRE_EMPLOYMENT']::compliance_stage[], true, false, null, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 10, 22),
    ('cv_resume', 'CV / Resume', 'Full employment history', 'BOTH', ARRAY['APPLICATION']::compliance_stage[], true, false, null, false, ARRAY['pdf', 'doc', 'docx'], 5, 23),
    ('gaps_explanation', 'Employment Gaps Explanation', 'Written explanation for any gaps in employment', 'BOTH', ARRAY['PRE_EMPLOYMENT']::compliance_stage[], false, false, null, false, ARRAY['pdf', 'doc', 'docx'], 5, 24),
    ('signed_contract', 'Signed Employment Contract', 'Fully executed employment contract', 'BOTH', ARRAY['PRE_EMPLOYMENT', 'ONBOARDING']::compliance_stage[], true, false, null, true, ARRAY['pdf'], 10, 25),
    ('policy_acknowledgements', 'Policy Acknowledgement Forms', 'Signed acknowledgement of company policies', 'BOTH', ARRAY['ONBOARDING']::compliance_stage[], true, false, null, false, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 10, 26),
    
    -- Internal Documents  
    ('application_form', 'Application Form', 'Completed job application', 'INTERNAL', ARRAY['APPLICATION']::compliance_stage[], true, false, null, false, ARRAY['pdf', 'doc', 'docx'], 5, 30),
    ('interview_notes', 'Interview Notes', 'Interview assessment and notes', 'INTERNAL', ARRAY['APPLICATION']::compliance_stage[], false, false, null, false, ARRAY['pdf', 'doc', 'docx'], 5, 31),
    ('offer_letter', 'Offer Letter', 'Formal offer of employment', 'INTERNAL', ARRAY['PRE_EMPLOYMENT']::compliance_stage[], true, false, null, false, ARRAY['pdf'], 5, 32),
    ('payroll_details', 'Payroll & Bank Details', 'Bank details for salary payments', 'INTERNAL', ARRAY['ONBOARDING']::compliance_stage[], true, false, null, true, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 5, 33),
    ('emergency_contacts', 'Emergency Contact Form', 'Emergency contact details', 'INTERNAL', ARRAY['ONBOARDING']::compliance_stage[], true, false, null, false, ARRAY['pdf', 'jpg', 'jpeg', 'png'], 2, 34)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    authority = EXCLUDED.authority,
    stages = EXCLUDED.stages,
    is_required = EXCLUDED.is_required,
    has_expiry = EXCLUDED.has_expiry,
    expiry_warning_days = EXCLUDED.expiry_warning_days,
    verification_required = EXCLUDED.verification_required,
    accepted_formats = EXCLUDED.accepted_formats,
    max_size_mb = EXCLUDED.max_size_mb,
    sort_order = EXCLUDED.sort_order;

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================
DO $$
BEGIN
    RAISE NOTICE 'Compliance schema created successfully!';
    RAISE NOTICE 'Tables created: compliance_persons, compliance_documents, compliance_document_types, compliance_folders, compliance_document_folders, compliance_checklists, compliance_stage_history, compliance_tasks, compliance_notifications, compliance_sync_log, compliance_audit_log';
    RAISE NOTICE 'Views created: v_compliance_status, v_expiring_documents';
    RAISE NOTICE 'Document types seeded: 28 types across HOME_OFFICE, CQC, BOTH, INTERNAL authorities';
END $$;
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
    ('71000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
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
    ('71000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
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
    ('71000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
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
    ('71000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
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
    ('71000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
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
    ('e1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000011', '71000000-0000-0000-0000-000000000001',
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
    ('e1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000008', '71000000-0000-0000-0000-000000000002',
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
    ('e1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000003',
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
    ('b1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003',
     null, 'APPLICATION',
     false, 'Initial application received',
     0, ARRAY['rtw_passport', 'cv_resume', 'photo_id'],
     NOW() - INTERVAL '45 days'),
    
    ('b1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003',
     'APPLICATION', 'PRE_EMPLOYMENT',
     true, 'All application stage documents verified',
     75, ARRAY['dbs_certificate', 'employment_references'],
     NOW() - INTERVAL '30 days'),
    
    ('b1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
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
    ('51000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'novumflow', 'careflow', 'PERSON_FULL',
     'a1000000-0000-0000-0000-000000000004', 'cfa10000-0000-0000-0000-000000000004', 'compliance_person',
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
    ('a1100000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'DOCUMENT_VERIFIED', 'compliance_document', 'd1000000-0000-0000-0000-000000000014',
     null, 'hr.admin@company.com', 'HR_ADMIN',
     '{"status": "UPLOADED"}'::jsonb,
     '{"status": "VERIFIED", "verified_at": "2024-11-14T10:30:00Z"}'::jsonb),
    
    ('a1100000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'STAGE_PROGRESSION', 'compliance_person', 'a1000000-0000-0000-0000-000000000003',
     null, 'system@novumflow.com', 'SYSTEM',
     '{"current_stage": "PRE_EMPLOYMENT"}'::jsonb,
     '{"current_stage": "ONBOARDING", "reason": "Offer accepted"}'::jsonb),
    
    ('a1100000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
     'DOCUMENT_EXPIRED', 'compliance_document', 'd1000000-0000-0000-0000-000000000011',
     null, 'system@novumflow.com', 'SYSTEM',
     '{"status": "VERIFIED"}'::jsonb,
     jsonb_build_object('status', 'EXPIRED', 'expired_at', (CURRENT_DATE - INTERVAL '5 days')::text));

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
