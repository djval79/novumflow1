-- ============================================================================
-- ADD AUTOMATION TRIGGERS
-- ============================================================================

-- Function to handle application stage changes
CREATE OR REPLACE FUNCTION handle_application_stage_change()
RETURNS TRIGGER AS $$
DECLARE
    automation_record RECORD;
    workflow_stage_id UUID;
BEGIN
    -- Check if stage has changed
    IF (TG_OP = 'UPDATE' AND OLD.current_stage_id IS DISTINCT FROM NEW.current_stage_id) OR (TG_OP = 'INSERT' AND NEW.current_stage_id IS NOT NULL) THEN
        
        workflow_stage_id := NEW.current_stage_id;

        -- Find active automations for this stage (on_enter)
        FOR automation_record IN 
            SELECT * FROM stage_automations 
            WHERE stage_id = workflow_stage_id 
            AND is_active = true 
            AND trigger_event = 'on_enter'
        LOOP
            -- Log the automation execution (we'll implement the actual execution logic in the backend/Edge Functions)
            -- For now, we just insert into the automation_execution_logs table we created earlier
            INSERT INTO automation_execution_logs (
                rule_id, -- We're using rule_id to store automation_id here for simplicity, or we could add a new column
                trigger_event,
                trigger_data,
                execution_status
            ) VALUES (
                automation_record.id,
                'stage_change',
                jsonb_build_object(
                    'application_id', NEW.id,
                    'old_stage_id', OLD.current_stage_id,
                    'new_stage_id', NEW.current_stage_id,
                    'action_type', automation_record.action_type,
                    'action_config', automation_record.action_config
                ),
                'pending' -- Marked as pending for the background worker/edge function to pick up
            );
        END LOOP;
        
        -- Handle on_exit for the old stage if it exists
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
                    execution_status
                ) VALUES (
                    automation_record.id,
                    'stage_change_exit',
                    jsonb_build_object(
                        'application_id', NEW.id,
                        'old_stage_id', OLD.current_stage_id,
                        'new_stage_id', NEW.current_stage_id,
                        'action_type', automation_record.action_type,
                        'action_config', automation_record.action_config
                    ),
                    'pending'
                );
            END LOOP;
        END IF;

    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_application_stage_change ON applications;
CREATE TRIGGER on_application_stage_change
    AFTER INSERT OR UPDATE OF current_stage_id ON applications
    FOR EACH ROW
    EXECUTE FUNCTION handle_application_stage_change();

SELECT 'SUCCESS! Automation triggers created.' as status;
