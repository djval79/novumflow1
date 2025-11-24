-- ============================================================================
-- ADD RECRUITMENT WORKFLOWS AND AUTOMATION
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

-- 3. STAGE AUTOMATIONS
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

-- 4. UPDATE JOB POSTINGS
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES recruitment_workflows(id) ON DELETE SET NULL;

-- 5. UPDATE APPLICATIONS
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS current_stage_id UUID REFERENCES workflow_stages(id) ON DELETE SET NULL;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_workflow_stages_workflow ON workflow_stages(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_order ON workflow_stages(workflow_id, stage_order);
CREATE INDEX IF NOT EXISTS idx_stage_automations_stage ON stage_automations(stage_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_workflow ON job_postings(workflow_id);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(current_stage_id);

-- RLS
ALTER TABLE recruitment_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_automations ENABLE ROW LEVEL SECURITY;

-- POLICIES
DROP POLICY IF EXISTS "auth_read_workflows" ON recruitment_workflows;
CREATE POLICY "auth_read_workflows" ON recruitment_workflows FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_workflows" ON recruitment_workflows;
CREATE POLICY "auth_manage_workflows" ON recruitment_workflows FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_read_stages" ON workflow_stages;
CREATE POLICY "auth_read_stages" ON workflow_stages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_stages" ON workflow_stages;
CREATE POLICY "auth_manage_stages" ON workflow_stages FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_read_automations" ON stage_automations;
CREATE POLICY "auth_read_automations" ON stage_automations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_automations" ON stage_automations;
CREATE POLICY "auth_manage_automations" ON stage_automations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- GRANT PERMISSIONS
GRANT ALL ON recruitment_workflows TO service_role;
GRANT ALL ON workflow_stages TO service_role;
GRANT ALL ON stage_automations TO service_role;

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

SELECT 'SUCCESS! Recruitment workflows tables created.' as status;
