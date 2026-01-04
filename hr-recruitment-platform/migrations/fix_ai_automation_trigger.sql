-- ============================================================================
-- IMPROVE AI SCREENING TRIGGER LOGIC (TENANT AWARE)
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_application_ai_score_update()
RETURNS TRIGGER AS $$
DECLARE
    v_shortlist_stage_id UUID;
    v_rejected_stage_id UUID;
    v_manual_review_stage_id UUID;
    v_settings RECORD;
    v_action_taken TEXT := 'none';
    v_tenant_name TEXT;
    v_recruiter_email TEXT;
    v_tenant_id UUID;
BEGIN
    -- Get tenant_id from application
    v_tenant_id := NEW.tenant_id;

    -- Only trigger if score has actually changed and is not null
    IF (OLD.ai_score IS DISTINCT FROM NEW.ai_score) AND NEW.ai_score IS NOT NULL THEN
        
        -- Get recruitment settings for this specific tenant
        SELECT * INTO v_settings FROM recruitment_settings WHERE organization_id = v_tenant_id LIMIT 1;
        
        -- If no tenant settings, fall back to global default (if exists) or skip
        IF v_settings IS NULL THEN
            SELECT * INTO v_settings FROM recruitment_settings LIMIT 1;
        END IF;

        -- Get Tenant Name and Recruiter Email for the automation engine
        SELECT company_name, company_email INTO v_tenant_name, v_recruiter_email FROM company_settings WHERE id = v_tenant_id LIMIT 1;
        
        -- Fallback for internal alerts
        IF v_recruiter_email IS NULL OR v_recruiter_email = '' THEN
           v_recruiter_email := v_settings.recruiter_notification_email;
        END IF;

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
                v_action_taken := 'auto_shortlisted';
            END IF;

        -- LOGIC B: AUTO-REJECT (Score < threshold)
        ELSIF NEW.ai_score < COALESCE(v_settings.ai_reject_threshold, 30) AND COALESCE(v_settings.ai_auto_reject_enabled, false) THEN
            IF v_rejected_stage_id IS NOT NULL AND NEW.current_stage_id IS DISTINCT FROM v_rejected_stage_id THEN
                UPDATE applications 
                SET current_stage_id = v_rejected_stage_id,
                    notes = COALESCE(notes, '') || E'\n[Auto-Automation] Moved to Rejected due to low AI score (' || NEW.ai_score || E'%).\n'
                WHERE id = NEW.id;
                v_action_taken := 'auto_rejected';
            END IF;

        -- LOGIC C: HUMAN-IN-THE-LOOP (Everything else moves to Manual Review if it exists)
        ELSE
            IF v_manual_review_stage_id IS NOT NULL AND NEW.current_stage_id IS DISTINCT FROM v_manual_review_stage_id THEN
                UPDATE applications 
                SET current_stage_id = v_manual_review_stage_id,
                    notes = COALESCE(notes, '') || E'\n[Auto-Automation] Moved to Manual Review for human assessment (AI score: ' || NEW.ai_score || E'%).\n'
                WHERE id = NEW.id;
                v_action_taken := 'manual_review';
            END IF;
        END IF;

        -- Log the event for the automation engine with enriched data
        INSERT INTO automation_execution_logs (
            trigger_event,
            trigger_data,
            execution_status,
            tenant_id,
            created_at
        ) VALUES (
            'ai_score_update',
            jsonb_build_object(
                'application_id', NEW.id,
                'ai_score', NEW.ai_score,
                'ai_summary', NEW.ai_summary,
                'applicant_name', NEW.applicant_first_name || ' ' || NEW.applicant_last_name,
                'applicant_email', NEW.applicant_email,
                'action_taken', v_action_taken,
                'tenant_name', COALESCE(v_tenant_name, 'NovumFlow'),
                'recruiter_email', COALESCE(v_recruiter_email, 'recruitment@novumflow.com')
            ),
            'pending',
            v_tenant_id,
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Verification
SELECT 'Improved AI Screening Trigger logic deployed.' as status;
