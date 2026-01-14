-- Sync CareFlow Training Completions to NovumFlow HR
-- Triggers when a staff member completes a training module in CareFlow LMS

CREATE OR REPLACE FUNCTION sync_careflow_training_to_hr()
RETURNS TRIGGER AS $$
DECLARE
    v_novumflow_employee_id UUID;
    v_training_title TEXT;
    v_provider TEXT := 'CareFlow LMS';
BEGIN
    -- Only proceed if status changed to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- 1. Get the linked NovumFlow Employee ID
        SELECT novumflow_employee_id INTO v_novumflow_employee_id
        FROM careflow_staff
        WHERE id = NEW.staff_id;

        -- If linked employee found
        IF v_novumflow_employee_id IS NOT NULL THEN
            
            -- 2. Get the Training Module Title
            SELECT title INTO v_training_title
            FROM careflow_training_modules
            WHERE id = NEW.module_id;

            -- 3. Insert into NovumFlow Training Records
            -- We insert a new record to maintain history
            INSERT INTO training_records (
                tenant_id,
                employee_id,
                training_name,
                training_type,
                provider,
                completion_date,
                status,
                notes
            ) VALUES (
                NEW.tenant_id,
                v_novumflow_employee_id,
                v_training_title,
                'Online Course', -- Default type
                v_provider,
                COALESCE(NEW.completed_at::DATE, CURRENT_DATE),
                'Valid',
                'Synced from CareFlow LMS. Score: ' || COALESCE(NEW.score::TEXT, 'N/A') || '%'
            );
            
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow idempotency
DROP TRIGGER IF EXISTS trg_sync_careflow_training ON careflow_training_progress;

-- Create Trigger
CREATE TRIGGER trg_sync_careflow_training
AFTER UPDATE ON careflow_training_progress
FOR EACH ROW
EXECUTE FUNCTION sync_careflow_training_to_hr();
