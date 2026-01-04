-- ============================================================================
-- ADD AI AUTOMATION SETTINGS TO RECRUITMENT_SETTINGS
-- ============================================================================

-- 1. Add columns to recruitment_settings
ALTER TABLE recruitment_settings 
ADD COLUMN IF NOT EXISTS ai_auto_shortlist_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_auto_reject_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_shortlist_threshold INTEGER DEFAULT 85,
ADD COLUMN IF NOT EXISTS ai_reject_threshold INTEGER DEFAULT 30;

-- 2. Update existing trigger function to use these settings instead of hardcoded values
CREATE OR REPLACE FUNCTION handle_application_ai_score_update()
RETURNS TRIGGER AS $$
DECLARE
    v_shortlist_stage_id UUID;
    v_rejected_stage_id UUID;
    v_manual_review_stage_id UUID;
    v_settings RECORD;
BEGIN
    -- Only trigger if score has actually changed and is not null
    IF (OLD.ai_score IS DISTINCT FROM NEW.ai_score) AND NEW.ai_score IS NOT NULL THEN
        
        -- Get recruitment settings
        SELECT * INTO v_settings FROM recruitment_settings LIMIT 1;
        
        -- If settings don't exist, we use defaults
        IF v_settings IS NULL THEN
            -- Defaults matching the initial logic
            v_settings := (false, false, 85, 30)::RECORD;
        END IF;

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
        SELECT ws.id INTO v_shortlist_stage_id
        FROM workflow_stages ws
        JOIN job_postings jp ON jp.workflow_id = ws.workflow_id
        WHERE jp.id = NEW.job_posting_id 
        AND (ws.name = 'Shortlisted' OR ws.name = 'Shortlist')
        LIMIT 1;

        SELECT ws.id INTO v_rejected_stage_id
        FROM workflow_stages ws
        JOIN job_postings jp ON jp.workflow_id = ws.workflow_id
        WHERE jp.id = NEW.job_posting_id 
        AND (ws.stage_type = 'rejected' OR ws.name = 'Rejected')
        LIMIT 1;

        SELECT ws.id INTO v_manual_review_stage_id
        FROM workflow_stages ws
        JOIN job_postings jp ON jp.workflow_id = ws.workflow_id
        WHERE jp.id = NEW.job_posting_id 
        AND ws.name = 'Manual Review'
        LIMIT 1;

        -- LOGIC A: AUTO-SHORTLIST (Score >= threshold)
        IF NEW.ai_score >= COALESCE(v_settings.ai_shortlist_threshold, 85) AND COALESCE(v_settings.ai_auto_shortlist_enabled, false) THEN
            IF v_shortlist_stage_id IS NOT NULL AND NEW.current_stage_id IS DISTINCT FROM v_shortlist_stage_id THEN
                UPDATE applications 
                SET current_stage_id = v_shortlist_stage_id,
                    notes = COALESCE(notes, '') || E'\n[Auto-Automation] Moved to Shortlisted due to high AI score (' || NEW.ai_score || E'%).\n'
                WHERE id = NEW.id;
            END IF;

        -- LOGIC B: AUTO-REJECT (Score < threshold)
        ELSIF NEW.ai_score < COALESCE(v_settings.ai_reject_threshold, 30) AND COALESCE(v_settings.ai_auto_reject_enabled, false) THEN
            IF v_rejected_stage_id IS NOT NULL AND NEW.current_stage_id IS DISTINCT FROM v_rejected_stage_id THEN
                UPDATE applications 
                SET current_stage_id = v_rejected_stage_id,
                    notes = COALESCE(notes, '') || E'\n[Auto-Automation] Moved to Rejected due to low AI score (' || NEW.ai_score || E'%).\n'
                WHERE id = NEW.id;
            END IF;

        -- LOGIC C: HUMAN-IN-THE-LOOP (Everything else moves to Manual Review if it exists)
        ELSE
            IF v_manual_review_stage_id IS NOT NULL AND NEW.current_stage_id IS DISTINCT FROM v_manual_review_stage_id THEN
                UPDATE applications 
                SET current_stage_id = v_manual_review_stage_id,
                    notes = COALESCE(notes, '') || E'\n[Auto-Automation] Moved to Manual Review for human assessment (AI score: ' || NEW.ai_score || E'%).\n'
                WHERE id = NEW.id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification
SELECT 'AI Automation settings added and trigger updated.' as status;
