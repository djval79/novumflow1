-- Migration: 017_sync_employee_trigger.sql
-- Purpose: Trigger sync to CareFlow when employee is hired

CREATE EXTENSION IF NOT EXISTS "pg_net";

CREATE OR REPLACE FUNCTION sync_employee_to_careflow()
RETURNS TRIGGER AS $$
DECLARE
    v_project_url TEXT;
    v_service_key TEXT;
BEGIN
    -- Only sync if status changed to 'active' (Hired)
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        
        -- Updated with valid Project URL
        v_project_url := 'https://niikshfoecitimepiifo.supabase.co/functions/v1/sync-to-careflow';
        
        -- Service Role Key for secure Edge Function invocation
        v_service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA1MjIxNSwiZXhwIjoyMDc4NjI4MjE1fQ.sPu18Bb90PKUL_rTDLK6MPvgpS1FfduWq4H0xoNWlA8';
        
        RAISE NOTICE 'Triggering sync for employee % to CareFlow', NEW.id;
        
        -- Trigger Edge Function
        PERFORM net.http_post(
            url => v_project_url,
            headers => jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_key
            ),
            body => jsonb_build_object(
                'employee_id', NEW.id,
                'tenant_id', NEW.tenant_id,
                'action', 'sync',
                'include_compliance', true
            )
        );
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_employee_hired_sync ON employees;
CREATE TRIGGER trg_employee_hired_sync
AFTER INSERT OR UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION sync_employee_to_careflow();
