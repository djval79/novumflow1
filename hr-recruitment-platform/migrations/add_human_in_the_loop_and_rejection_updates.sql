-- ============================================================================
-- HUMAN-IN-THE-LOOP & REJECTION TEMPLATE CUSTOMIZATION
-- ============================================================================

-- 1. Create "Manual Review" stage if it doesn't exist
DO $$
DECLARE
    v_wf_id UUID;
    v_stage_id UUID;
BEGIN
    FOR v_wf_id IN SELECT id FROM recruitment_workflows LOOP
        -- Check if "Manual Review" stage exists
        SELECT id INTO v_stage_id FROM workflow_stages 
        WHERE workflow_id = v_wf_id AND name = 'Manual Review' LIMIT 1;
        
        IF v_stage_id IS NULL THEN
            -- Insert the Manual Review stage after Screening
            INSERT INTO workflow_stages (workflow_id, name, stage_order, stage_type)
            VALUES (v_wf_id, 'Manual Review', 2, 'screening');
            
            -- Adjust subsequent stages
            UPDATE workflow_stages SET stage_order = stage_order + 1 
            WHERE workflow_id = v_wf_id AND stage_order >= 2 AND name != 'Manual Review';
        END IF;
    END LOOP;
END $$;

-- 2. Update AI Screening Trigger Logic for Human-in-the-Loop (30-84 range)
CREATE OR REPLACE FUNCTION handle_application_ai_score_update()
RETURNS TRIGGER AS $$
DECLARE
    shortlist_stage_id UUID;
    rejected_stage_id UUID;
    manual_review_stage_id UUID;
    is_auto_shortlist_enabled BOOLEAN := true;
    is_auto_reject_enabled BOOLEAN := true;
    is_human_in_loop_enabled BOOLEAN := true;
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

        -- Find stages for this job's workflow
        SELECT ws.id INTO shortlist_stage_id
        FROM workflow_stages ws
        JOIN job_postings jp ON jp.workflow_id = ws.workflow_id
        WHERE jp.id = NEW.job_posting_id 
        AND (ws.name = 'Shortlisted' OR ws.name = 'Shortlist')
        LIMIT 1;

        SELECT ws.id INTO rejected_stage_id
        FROM workflow_stages ws
        JOIN job_postings jp ON jp.workflow_id = ws.workflow_id
        WHERE jp.id = NEW.job_posting_id 
        AND (ws.stage_type = 'rejected' OR ws.name = 'Rejected')
        LIMIT 1;

        SELECT ws.id INTO manual_review_stage_id
        FROM workflow_stages ws
        JOIN job_postings jp ON jp.workflow_id = ws.workflow_id
        WHERE jp.id = NEW.job_posting_id 
        AND ws.name = 'Manual Review'
        LIMIT 1;

        -- LOGIC A: AUTO-SHORTLIST (Score >= 85)
        IF NEW.ai_score >= 85 AND is_auto_shortlist_enabled THEN
            IF shortlist_stage_id IS NOT NULL AND NEW.current_stage_id IS DISTINCT FROM shortlist_stage_id THEN
                UPDATE applications 
                SET current_stage_id = shortlist_stage_id,
                    notes = COALESCE(notes, '') || E'\n[Auto-Automation] Moved to Shortlisted due to high AI score (' || NEW.ai_score || E'%).\n'
                WHERE id = NEW.id;
            END IF;

        -- LOGIC B: AUTO-REJECT (Score < 30)
        ELSIF NEW.ai_score < 30 AND is_auto_reject_enabled THEN
            IF rejected_stage_id IS NOT NULL AND NEW.current_stage_id IS DISTINCT FROM rejected_stage_id THEN
                UPDATE applications 
                SET current_stage_id = rejected_stage_id,
                    notes = COALESCE(notes, '') || E'\n[Auto-Automation] Moved to Rejected due to low AI score (' || NEW.ai_score || E'%).\n'
                WHERE id = NEW.id;
            END IF;

        -- LOGIC C: HUMAN-IN-THE-LOOP (30 <= Score < 85)
        ELSIF NEW.ai_score >= 30 AND NEW.ai_score < 85 AND is_human_in_loop_enabled THEN
            IF manual_review_stage_id IS NOT NULL AND NEW.current_stage_id IS DISTINCT FROM manual_review_stage_id THEN
                UPDATE applications 
                SET current_stage_id = manual_review_stage_id,
                    notes = COALESCE(notes, '') || E'\n[Auto-Automation] Moved to Manual Review for human assessment (AI score: ' || NEW.ai_score || E'%).\n'
                WHERE id = NEW.id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Customize the Rejection Email Automation to include AI Reasoning
-- First, find all rejection stage automations and update their config
UPDATE stage_automations 
SET action_config = action_config || jsonb_build_object(
    'body', 'Dear {{applicant_name}},\n\nThank you for your interest in the {{job_title}} position at NovumFlow. After carefull review of your application, we have decided not to move forward with your candidacy at this time.\n\nOur AI-assisted screening provided the following insights regarding your profile:\n\n{{ai_summary}}\n\nWe appreciate the time you took to apply and wish you the best in your job search.\n\nBest regards,\nNovumFlow Recruitment Team'
)
WHERE name = 'Auto Rejection Email';

-- 4. Add ai_summary to variables in the email_templates table for rejections
UPDATE email_templates
SET body_html = 'Dear {{applicant_name}},\n\nThank you for your interest in the {{job_title}} position. After review, we have decided not to move forward at this time.\n\nAI Insights:\n{{ai_summary}}\n\nBest regards,\nRecruitment Team',
    variables = variables || '["ai_summary"]'::jsonb
WHERE template_name = 'rejection_letter' AND NOT (variables @> '["ai_summary"]'::jsonb);
