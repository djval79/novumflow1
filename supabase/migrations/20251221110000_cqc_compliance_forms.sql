-- ==========================================
-- Migration: Character Declarations & Interview Evaluations
-- Purpose: Support CQC Regulation 19 compliance
-- Date: 2025-12-21
-- ==========================================

-- Character Declarations Table (CQC Regulation 19: Fit & Proper Persons)
CREATE TABLE IF NOT EXISTS character_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    
    -- Personal Details
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    current_address TEXT NOT NULL,
    
    -- Disclosures (CQC Regulation 19 requirements)
    criminal_convictions BOOLEAN DEFAULT FALSE,
    criminal_convictions_details TEXT,
    pending_charges BOOLEAN DEFAULT FALSE,
    pending_charges_details TEXT,
    disciplinary_proceedings BOOLEAN DEFAULT FALSE,
    disciplinary_proceedings_details TEXT,
    professional_sanctions BOOLEAN DEFAULT FALSE,
    professional_sanctions_details TEXT,
    safeguarding_concerns BOOLEAN DEFAULT FALSE,
    safeguarding_concerns_details TEXT,
    barred_lists BOOLEAN DEFAULT FALSE,
    barred_lists_details TEXT,
    health_conditions BOOLEAN DEFAULT FALSE,
    health_conditions_details TEXT,
    
    -- Values-Based Statements
    compassion_statement TEXT,
    respect_statement TEXT,
    integrity_statement TEXT,
    
    -- Consents
    consent_background_check BOOLEAN DEFAULT FALSE,
    consent_reference_check BOOLEAN DEFAULT FALSE,
    consent_data_processing BOOLEAN DEFAULT FALSE,
    declaration_truthful BOOLEAN DEFAULT FALSE,
    
    -- Signature
    signature_name TEXT NOT NULL,
    signature_date DATE NOT NULL,
    
    -- Assessment Metadata
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) DEFAULT 'low',
    disclosure_count INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('pending', 'requires_review', 'approved', 'rejected')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_character_declarations_tenant ON character_declarations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_character_declarations_employee ON character_declarations(employee_id);
CREATE INDEX IF NOT EXISTS idx_character_declarations_status ON character_declarations(status);
CREATE INDEX IF NOT EXISTS idx_character_declarations_risk ON character_declarations(risk_level);

-- Interview Evaluations Table (Values-Based Recruitment)
CREATE TABLE IF NOT EXISTS interview_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    
    -- Interview Details
    candidate_name TEXT NOT NULL,
    position TEXT NOT NULL,
    interviewer_name TEXT NOT NULL,
    interview_date DATE NOT NULL,
    interview_type TEXT CHECK (interview_type IN ('phone', 'video', 'in-person', 'panel')) DEFAULT 'in-person',
    evaluation_type TEXT CHECK (evaluation_type IN ('values_based', 'competency', 'technical', 'general')) DEFAULT 'values_based',
    
    -- Scores (JSONB for flexibility)
    value_scores JSONB DEFAULT '[]'::jsonb,
    -- Expected format: [{"value": "compassion", "score": 4, "evidence": "...", "flags": ["positive:...", "redflag:..."]}]
    
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    
    -- Assessment
    overall_impression TEXT,
    strengths TEXT[] DEFAULT '{}',
    development_areas TEXT[] DEFAULT '{}',
    
    -- Recommendation
    recommendation TEXT CHECK (recommendation IN ('strongly_recommend', 'recommend', 'consider', 'do_not_recommend')),
    recommendation_notes TEXT,
    
    -- Flags & Concerns
    red_flags TEXT[] DEFAULT '{}',
    safeguarding_concerns BOOLEAN DEFAULT FALSE,
    safeguarding_notes TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for interview evaluations
CREATE INDEX IF NOT EXISTS idx_interview_evaluations_tenant ON interview_evaluations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_interview_evaluations_application ON interview_evaluations(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_evaluations_recommendation ON interview_evaluations(recommendation);
CREATE INDEX IF NOT EXISTS idx_interview_evaluations_date ON interview_evaluations(interview_date);

-- Extend right_to_work_checks table with new columns for 2024/2025 compliance
ALTER TABLE right_to_work_checks 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS share_code_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS share_code_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_method TEXT CHECK (verification_method IN ('online', 'manual', 'employer_checking_service')) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS requires_followup BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS followup_reason TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add new statuses to existing status column (if not already done)
-- Note: This requires updating the check constraint
DO $$
BEGIN
    ALTER TABLE right_to_work_checks 
    DROP CONSTRAINT IF EXISTS right_to_work_checks_status_check;
    
    ALTER TABLE right_to_work_checks 
    ADD CONSTRAINT right_to_work_checks_status_check 
    CHECK (status IN ('verified', 'expired', 'renewal_required', 'pending_verification', 'invalid', 'blocked'));
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not update status constraint: %', SQLERRM;
END $$;

-- Create index for new columns
CREATE INDEX IF NOT EXISTS idx_rtw_requires_followup ON right_to_work_checks(requires_followup) WHERE requires_followup = TRUE;
CREATE INDEX IF NOT EXISTS idx_rtw_employee ON right_to_work_checks(employee_id);

-- Row Level Security for character_declarations
ALTER TABLE character_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant character declarations" ON character_declarations
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Users can create character declarations in own tenant" ON character_declarations
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Managers can update character declarations" ON character_declarations
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = TRUE 
            AND role IN ('owner', 'admin', 'manager')
        )
    );

-- Row Level Security for interview_evaluations
ALTER TABLE interview_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant interview evaluations" ON interview_evaluations
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Users can create interview evaluations in own tenant" ON interview_evaluations
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Managers can update interview evaluations" ON interview_evaluations
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() 
            AND is_active = TRUE 
            AND role IN ('owner', 'admin', 'manager')
        )
    );

-- Comments for documentation
COMMENT ON TABLE character_declarations IS 'CQC Regulation 19 compliant character declaration forms for staff';
COMMENT ON TABLE interview_evaluations IS 'Values-based interview scoring for care sector recruitment';
COMMENT ON COLUMN character_declarations.risk_level IS 'Auto-calculated based on number of disclosures';
COMMENT ON COLUMN interview_evaluations.value_scores IS 'JSONB array of values with scores, evidence, and flags';
