-- ============================================================================
-- ADD AI SCREENING AUTOMATION TRIGGERS
-- ============================================================================

-- Function to handle AI score updates
CREATE OR REPLACE FUNCTION handle_application_ai_score_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if score has actually changed and is not null
    IF (OLD.ai_score IS DISTINCT FROM NEW.ai_score) AND NEW.ai_score IS NOT NULL THEN
        -- Insert into automation execution logs
        -- The automation engine will pick this up and check for rules matching 'ai_score_update'
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
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_application_ai_score_update ON applications;
CREATE TRIGGER on_application_ai_score_update
    AFTER UPDATE OF ai_score ON applications
    FOR EACH ROW
    EXECUTE FUNCTION handle_application_ai_score_update();

-- Verification
SELECT 'Trigger on_application_ai_score_update created.' as status;
