-- ============================================================================
-- CONSOLIDATED RECRUITMENT AND AUTOMATION DEPLOYMENT
-- ============================================================================
-- This script ensures all tables for recruitment and automation are present.
-- It is designed to be idempotent.
-- ============================================================================

-- 1. RECRUITMENT WORKFLOWS
CREATE TABLE IF NOT EXISTS recruitment_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WORKFLOW STAGES
CREATE TABLE IF NOT EXISTS workflow_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES recruitment_workflows(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    stage_order INTEGER NOT NULL,
    stage_type TEXT DEFAULT 'custom' CHECK (stage_type IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'custom')),
    is_system_stage BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. JOB POSTINGS
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_title TEXT NOT NULL,
    department TEXT NOT NULL,
    employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'temporary')),
    description TEXT,
    location TEXT DEFAULT 'Remote',
    salary_range TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'cancelled')),
    application_deadline TIMESTAMPTZ,
    workflow_id UUID REFERENCES recruitment_workflows(id) ON DELETE SET NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
    applicant_first_name TEXT NOT NULL,
    applicant_last_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    applicant_phone TEXT,
    cv_url TEXT,
    cover_letter TEXT,
    portfolio_url TEXT,
    linkedin_url TEXT,
    status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_extended', 'hired', 'rejected', 'ref_1_pending', 'ref_1_completed', 'ref_2_pending', 'ref_2_completed', 'dbs_pending', 'dbs_completed')),
    pipeline_stage TEXT DEFAULT 'screening',
    current_stage_id UUID REFERENCES workflow_stages(id) ON DELETE SET NULL,
    score NUMERIC,
    notes TEXT,
    source TEXT DEFAULT 'direct',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INTERVIEWS
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    interview_type TEXT NOT NULL CHECK (interview_type IN ('screening', 'technical', 'cultural', 'final', 'manager_review')),
    scheduled_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show')),
    rating NUMERIC CHECK (rating >= 0 AND rating <= 5),
    notes TEXT,
    interviewer_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STAGE AUTOMATIONS
CREATE TABLE IF NOT EXISTS stage_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID REFERENCES workflow_stages(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_event TEXT DEFAULT 'on_enter' CHECK (trigger_event IN ('on_enter', 'on_exit')),
    action_type TEXT NOT NULL CHECK (action_type IN ('send_email', 'schedule_interview', 'create_task', 'update_status', 'ai_interview')),
    action_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AUTOMATION_EXECUTION_LOGS
CREATE TABLE IF NOT EXISTS automation_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID,
    execution_timestamp TIMESTAMPTZ DEFAULT NOW(),
    trigger_event TEXT,
    trigger_data JSONB DEFAULT '{}',
    execution_status TEXT NOT NULL,
    execution_duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_workflow ON job_postings(workflow_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(applicant_email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_interviews_application ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_date ON interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_workflow ON workflow_stages(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_order ON workflow_stages(workflow_id, stage_order);
CREATE INDEX IF NOT EXISTS idx_stage_automations_stage ON stage_automations(stage_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_timestamp ON automation_execution_logs(execution_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_execution_logs(execution_status);

-- ENABLE RLS
ALTER TABLE recruitment_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_execution_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES (Simplified for Internal Workspace)
DO $$ 
BEGIN
    -- Recruitment Workflows
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'auth_manage_workflows_v1') THEN
        CREATE POLICY "auth_manage_workflows_v1" ON recruitment_workflows FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    -- Workflow Stages
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'auth_manage_stages_v1') THEN
        CREATE POLICY "auth_manage_stages_v1" ON workflow_stages FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    -- Job Postings
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'auth_manage_jobs_v1') THEN
        CREATE POLICY "auth_manage_jobs_v1" ON job_postings FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    -- Applications
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'auth_manage_applications_v1') THEN
        CREATE POLICY "auth_manage_applications_v1" ON applications FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    -- Interviews
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'auth_manage_interviews_v1') THEN
        CREATE POLICY "auth_manage_interviews_v1" ON interviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    -- Stage Automations
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'auth_manage_automations_v1') THEN
        CREATE POLICY "auth_manage_automations_v1" ON stage_automations FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    -- Automation Logs
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'auth_manage_logs_v1') THEN
        CREATE POLICY "auth_manage_logs_v1" ON automation_execution_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- GRANT PERMISSIONS
GRANT ALL ON recruitment_workflows TO service_role;
GRANT ALL ON workflow_stages TO service_role;
GRANT ALL ON job_postings TO service_role;
GRANT ALL ON applications TO service_role;
GRANT ALL ON interviews TO service_role;
GRANT ALL ON stage_automations TO service_role;
GRANT ALL ON automation_execution_logs TO service_role;

-- SEED DEFAULT WORKFLOW
DO $$
DECLARE
    wf_id UUID;
    stage_applied UUID;
    stage_screening UUID;
    stage_interview UUID;
    stage_offer UUID;
    stage_hired UUID;
    stage_rejected UUID;
BEGIN
    -- Create default workflow if not exists
    IF NOT EXISTS (SELECT 1 FROM recruitment_workflows WHERE is_default = true) THEN
        INSERT INTO recruitment_workflows (name, description, is_default)
        VALUES ('Standard Recruitment Process', 'Default workflow for general hiring', true)
        RETURNING id INTO wf_id;

        -- Create stages
        INSERT INTO workflow_stages (workflow_id, name, stage_order, stage_type, is_system_stage)
        VALUES (wf_id, 'Applied', 1, 'applied', true) RETURNING id INTO stage_applied;

        INSERT INTO workflow_stages (workflow_id, name, stage_order, stage_type)
        VALUES (wf_id, 'Screening', 2, 'screening') RETURNING id INTO stage_screening;

        INSERT INTO workflow_stages (workflow_id, name, stage_order, stage_type)
        VALUES (wf_id, 'Interview', 3, 'interview') RETURNING id INTO stage_interview;

        INSERT INTO workflow_stages (workflow_id, name, stage_order, stage_type)
        VALUES (wf_id, 'Offer', 4, 'offer') RETURNING id INTO stage_offer;

        INSERT INTO workflow_stages (workflow_id, name, stage_order, stage_type, is_system_stage)
        VALUES (wf_id, 'Hired', 5, 'hired', true) RETURNING id INTO stage_hired;

        INSERT INTO workflow_stages (workflow_id, name, stage_order, stage_type, is_system_stage)
        VALUES (wf_id, 'Rejected', 6, 'rejected', true) RETURNING id INTO stage_rejected;
        
        -- Add sample automation for Interview stage
        INSERT INTO stage_automations (stage_id, name, action_type, action_config)
        VALUES (stage_interview, 'Send Interview Invitation', 'send_email', '{"template_id": "interview_invite", "subject": "Interview Invitation"}');

    END IF;
END $$;
