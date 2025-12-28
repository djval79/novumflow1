-- ============================================================================
-- AI SCREENING AUTOMATIONS (SHORTLIST & REJECT)
-- ============================================================================

-- 1. Ensure "Shortlisted" stage exists in the default workflow
DO $$
DECLARE
    v_wf_id UUID;
    v_stage_id UUID;
BEGIN
    -- Get the standard workflow ID
    SELECT id INTO v_wf_id FROM recruitment_workflows WHERE is_default = true LIMIT 1;
    
    IF v_wf_id IS NOT NULL THEN
        -- Check if "Shortlisted" stage exists
        SELECT id INTO v_stage_id FROM workflow_stages 
        WHERE workflow_id = v_wf_id AND name = 'Shortlisted' LIMIT 1;
        
        -- If not, create it between Screening (2) and Interview (3)
        IF v_stage_id IS NULL THEN
            -- Shift existing stages 3-6 up
            UPDATE workflow_stages SET stage_order = stage_order + 1 
            WHERE workflow_id = v_wf_id AND stage_order >= 3;
            
            -- Insert the Shortlisted stage
            INSERT INTO workflow_stages (workflow_id, name, stage_order, stage_type)
            VALUES (v_wf_id, 'Shortlisted', 3, 'screening')
            RETURNING id INTO v_stage_id;
            
            RAISE NOTICE 'Created Shortlisted stage with ID %', v_stage_id;
        END IF;

        -- 3. Ensure Auto-Rejection Email Automation exists for "Rejected" stage
        SELECT id INTO v_stage_id FROM workflow_stages 
        WHERE workflow_id = v_wf_id AND stage_type = 'rejected' LIMIT 1;

        IF v_stage_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM stage_automations WHERE stage_id = v_stage_id AND name = 'Auto Rejection Email') THEN
                INSERT INTO stage_automations (stage_id, name, trigger_event, action_type, action_config)
                VALUES (
                    v_stage_id, 
                    'Auto Rejection Email', 
                    'on_enter', 
                    'send_email', 
                    jsonb_build_object(
                        'subject', 'Update regarding your application',
                        'body', 'Dear {{applicant_name}},\n\nThank you for your interest. After review, we have decided not to move forward with your application at this time.\n\nBest regards,\nRecruitment Team',
                        'recipient_type', 'applicant'
                    )
                );
            END IF;
        END IF;
    END IF;
END $$;

-- 2. Consolidated AI Screening Trigger Function
CREATE OR REPLACE FUNCTION handle_application_ai_score_update()
RETURNS TRIGGER AS $$
DECLARE
    shortlist_stage_id UUID;
    rejected_stage_id UUID;
    is_auto_shortlist_enabled BOOLEAN := true;
    is_auto_reject_enabled BOOLEAN := true;
BEGIN
    -- Only trigger if score has actually changed and is not null
    IF (OLD.ai_score IS DISTINCT FROM NEW.ai_score) AND NEW.ai_score IS NOT NULL THEN
        
        -- Log the event for the automation engine
        INSERT INTO automation_execution_logs (
            trigger_event,
            trigger_data,
            execution_status,
            created_at
        ) VALUES (
            'ai_score_update',
            jsonb_build_object(
                'application_id', NEW.id,
                'ai_score', NEW.ai_score,
                'ai_summary', NEW.ai_summary,
                'applicant_name', NEW.applicant_first_name || ' ' || NEW.applicant_last_name
            ),
            'pending',
            NOW()
        );

        -- LOGIC A: AUTO-SHORTLIST (Score >= 85)
        IF NEW.ai_score >= 85 AND is_auto_shortlist_enabled THEN
            -- Find the Shortlisted stage for this job's workflow
            SELECT ws.id INTO shortlist_stage_id
            FROM workflow_stages ws
            JOIN job_postings jp ON jp.workflow_id = ws.workflow_id
            WHERE jp.id = NEW.job_posting_id 
            AND (ws.name = 'Shortlisted' OR ws.name = 'Shortlist')
            LIMIT 1;

            IF shortlist_stage_id IS NOT NULL AND NEW.current_stage_id IS DISTINCT FROM shortlist_stage_id THEN
                UPDATE applications 
                SET current_stage_id = shortlist_stage_id,
                    notes = COALESCE(notes, '') || E'\n[Auto-Automation] Moved to Shortlisted due to high AI score (' || NEW.ai_score || E'%).\n'
                WHERE id = NEW.id;
                
                INSERT INTO automation_execution_logs (
                    trigger_event, trigger_data, execution_status, created_at
                ) VALUES (
                    'auto_shortlist_action',
                    jsonb_build_object('application_id', NEW.id, 'new_stage_id', shortlist_stage_id, 'reason', 'AI Score >= 85'),
                    'success', NOW()
                );
            END IF;

        -- LOGIC B: AUTO-REJECT (Score < 30)
        ELSIF NEW.ai_score < 30 AND is_auto_reject_enabled THEN
            -- Find the Rejected stage for this job's workflow
            SELECT ws.id INTO rejected_stage_id
            FROM workflow_stages ws
            JOIN job_postings jp ON jp.workflow_id = ws.workflow_id
            WHERE jp.id = NEW.job_posting_id 
            AND (ws.stage_type = 'rejected' OR ws.name = 'Rejected')
            LIMIT 1;

            IF rejected_stage_id IS NOT NULL AND NEW.current_stage_id IS DISTINCT FROM rejected_stage_id THEN
                UPDATE applications 
                SET current_stage_id = rejected_stage_id,
                    notes = COALESCE(notes, '') || E'\n[Auto-Automation] Moved to Rejected due to low AI score (' || NEW.ai_score || E'%).\n'
                WHERE id = NEW.id;
                
                INSERT INTO automation_execution_logs (
                    trigger_event, trigger_data, execution_status, created_at
                ) VALUES (
                    'auto_reject_action',
                    jsonb_build_object('application_id', NEW.id, 'new_stage_id', rejected_stage_id, 'reason', 'AI Score < 30'),
                    'success', NOW()
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_application_ai_score_update ON applications;
CREATE TRIGGER on_application_ai_score_update
    AFTER UPDATE OF ai_score ON applications
    FOR EACH ROW
    EXECUTE FUNCTION handle_application_ai_score_update();

-- Verification
SELECT 'AI Screening Automations (Shortlist >= 85, Reject < 30) implemented.' as status;
