-- ============================================================================
-- SYSTEMATIC HARDENING OF TENANT ISOLATION AND CONNECTIVITY
-- ============================================================================

-- 1. ADD MISSING TENANT_ID COLUMNS
ALTER TABLE recruitment_workflows ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE workflow_stages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE stage_automations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 2. BACKFILL TENANT_ID
-- For workflows, try to find a job posting that uses it
UPDATE recruitment_workflows rw
SET tenant_id = jp.tenant_id
FROM job_postings jp
WHERE jp.workflow_id = rw.id
AND rw.tenant_id IS NULL;

-- For workflow stages
UPDATE workflow_stages ws
SET tenant_id = rw.tenant_id
FROM recruitment_workflows rw
WHERE ws.workflow_id = rw.id
AND ws.tenant_id IS NULL;

-- For stage automations
UPDATE stage_automations sa
SET tenant_id = ws.tenant_id
FROM workflow_stages ws
WHERE sa.stage_id = ws.id
AND sa.tenant_id IS NULL;

-- 3. HARDEN RLS POLICIES (REMOVE BROAD AUTHENTICATED BYPASS)
-- Function to drop policy if exists to avoid errors
CREATE OR REPLACE FUNCTION drop_policy_if_exists(p_table text, p_policy text) RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = p_table AND policyname = p_policy) THEN
        EXECUTE format('DROP POLICY %I ON %I', p_policy, p_table);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Remove broad policies for Recruitment
SELECT drop_policy_if_exists('applications', 'auth_manage_applications');
SELECT drop_policy_if_exists('applications', 'auth_read_applications');
SELECT drop_policy_if_exists('job_postings', 'job_postings_select_policy');
SELECT drop_policy_if_exists('recruitment_workflows', 'auth_read_workflows');
SELECT drop_policy_if_exists('recruitment_workflows', 'auth_manage_workflows');
SELECT drop_policy_if_exists('workflow_stages', 'auth_read_stages');
SELECT drop_policy_if_exists('employees', 'Authenticated users can manage employees');

-- Add correct tenant-isolated policies
ALTER TABLE recruitment_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access workflows in their tenant" ON recruitment_workflows
    FOR ALL TO authenticated USING (tenant_id IS NULL OR user_has_tenant_access(tenant_id));

ALTER TABLE workflow_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access stages in their tenant" ON workflow_stages
    FOR ALL TO authenticated USING (tenant_id IS NULL OR user_has_tenant_access(tenant_id));

ALTER TABLE stage_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access automations in their tenant" ON stage_automations
    FOR ALL TO authenticated USING (tenant_id IS NULL OR user_has_tenant_access(tenant_id));

-- 4. FIX TRIGGER LOGGING
CREATE OR REPLACE FUNCTION handle_application_stage_change()
RETURNS TRIGGER AS $$
DECLARE
    automation_record RECORD;
    workflow_stage_id UUID;
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.current_stage_id IS DISTINCT FROM NEW.current_stage_id) OR (TG_OP = 'INSERT' AND NEW.current_stage_id IS NOT NULL) THEN
        workflow_stage_id := NEW.current_stage_id;

        -- Find active automations for this stage
        FOR automation_record IN 
            SELECT * FROM stage_automations 
            WHERE stage_id = workflow_stage_id 
            AND is_active = true 
            AND trigger_event = 'on_enter'
        LOOP
            INSERT INTO automation_execution_logs (
                rule_id,
                trigger_event,
                trigger_data,
                execution_status,
                tenant_id -- Added tenant_id
            ) VALUES (
                automation_record.id,
                'stage_change',
                jsonb_build_object(
                    'application_id', NEW.id,
                    'old_stage_id', OLD.current_stage_id,
                    'new_stage_id', NEW.current_stage_id,
                    'action_type', automation_record.action_type,
                    'action_config', automation_record.action_config,
                    'applicant_name', NEW.applicant_first_name || ' ' || NEW.applicant_last_name,
                    'applicant_email', NEW.applicant_email
                ),
                'pending',
                NEW.tenant_id -- Log with application's tenant_id
            );
        END LOOP;
        
        -- Handle on_exit
        IF TG_OP = 'UPDATE' AND OLD.current_stage_id IS NOT NULL THEN
             FOR automation_record IN 
                SELECT * FROM stage_automations 
                WHERE stage_id = OLD.current_stage_id 
                AND is_active = true 
                AND trigger_event = 'on_exit'
            LOOP
                INSERT INTO automation_execution_logs (
                    rule_id,
                    trigger_event,
                    trigger_data,
                    execution_status,
                    tenant_id -- Added tenant_id
                ) VALUES (
                    automation_record.id,
                    'stage_change_exit',
                    jsonb_build_object(
                        'application_id', NEW.id,
                        'old_stage_id', OLD.current_stage_id,
                        'new_stage_id', NEW.current_stage_id,
                        'action_type', automation_record.action_type,
                        'action_config', automation_record.action_config,
                        'applicant_name', NEW.applicant_first_name || ' ' || NEW.applicant_last_name,
                        'applicant_email', NEW.applicant_email
                    ),
                    'pending',
                    NEW.tenant_id -- Log with application's tenant_id
                );
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FIX RECRUITMENT SETTINGS RLS
ALTER TABLE recruitment_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access recruitment settings in their organization" ON recruitment_settings;
CREATE POLICY "Users can access recruitment settings in their organization" ON recruitment_settings
    FOR ALL TO authenticated USING (user_has_tenant_access(organization_id));

-- 6. ADD COMPLIANCE CHECK AUTOMATION
-- We'll add a placeholder action that the engine can use
-- and a scheduled activity log entry
INSERT INTO automation_rules (
    rule_name, rule_type, trigger_event, is_active, tenant_id, actions
) 
SELECT 
    'Daily Compliance Check', 'system', 'scheduled_daily', true, id,
    '[{"action_type": "check_compliance", "config": {"notify_on_expiry_days": 30}}]'::jsonb
FROM tenants;

-- Done
DROP FUNCTION drop_policy_if_exists(text, text);
