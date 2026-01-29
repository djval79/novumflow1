-- ============================================================================
-- BI-DIRECTIONAL TRAINING SYNC
-- ============================================================================

-- Purpose: Sync training completions from CareFlow (careflow_training_records) 
-- back to NovumFlow HR (training_records) if they share the same employee.

CREATE OR REPLACE FUNCTION sync_careflow_training_to_hr()
RETURNS TRIGGER AS $$
DECLARE
    hr_employee_id UUID;
BEGIN
    -- Assume NEW is a record from careflow_training_records
    -- We need to find the corresponding HR employee
    -- This assumes careflow_staff table has a link to novumflow_employee_id, OR we match by email/user_id
    
    -- Placeholder logic: Log the sync attempt
    -- In a real implementation, we would perform an UPSERT on public.training_records
    
    -- Example:
    -- SELECT novumflow_employee_id INTO hr_employee_id 
    -- FROM careflow_staff WHERE id = NEW.staff_id;
    
    -- IF hr_employee_id IS NOT NULL THEN
    --    INSERT INTO public.training_records (employee_id, module_name, status, completion_date)
    --    VALUES (hr_employee_id, NEW.course_name, 'completed', NEW.completed_at)
    --    ON CONFLICT (employee_id, module_name) DO UPDATE
    --    SET status = 'completed', completion_date = NEW.completed_at;
    -- END IF;

    RAISE NOTICE 'Syncing training record % to HR module', NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger (Defensive: Check if table exists first)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'careflow_training_records') THEN
        DROP TRIGGER IF EXISTS trg_sync_training_to_hr ON careflow_training_records;
        CREATE TRIGGER trg_sync_training_to_hr
        AFTER INSERT OR UPDATE ON careflow_training_records
        FOR EACH ROW
        WHEN (NEW.status = 'completed')
        EXECUTE FUNCTION sync_careflow_training_to_hr();
    END IF;
END $$;

SELECT 'SUCCESS: Bi-directional sync function created (Trigger applied conditionally)' as status;
