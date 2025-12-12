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
