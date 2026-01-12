-- Hotfix: Fix triggers that crash on INSERT because of OLD variable access

-- 1. Fix sync_employee_names
CREATE OR REPLACE FUNCTION sync_employee_names()
RETURNS TRIGGER AS $$
BEGIN
    -- If INSERT, always sync
    -- If UPDATE, check if first_name/last_name changed
    IF (TG_OP = 'INSERT') OR 
       (NEW.first_name IS DISTINCT FROM OLD.first_name) OR 
       (NEW.last_name IS DISTINCT FROM OLD.last_name) THEN
        
        IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
            NEW.name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
        END IF;
    END IF;

    -- Handle name-to-first/last sync
    IF (TG_OP = 'INSERT') OR (NEW.name IS DISTINCT FROM OLD.name) THEN
        IF (NEW.first_name IS NULL AND NEW.last_name IS NULL) AND NEW.name IS NOT NULL THEN
            NEW.first_name := split_part(NEW.name, ' ', 1);
            NEW.last_name := NULLIF(substring(NEW.name from position(' ' in NEW.name) + 1), '');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix sync_employee_to_careflow
CREATE OR REPLACE FUNCTION sync_employee_to_careflow()
RETURNS TRIGGER AS $$
DECLARE
    v_project_url TEXT;
    v_service_key TEXT;
    v_should_sync BOOLEAN := FALSE;
BEGIN
    -- Only sync if status changed to 'active' (Hired)
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'active' THEN
            v_should_sync := TRUE;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
            v_should_sync := TRUE;
        END IF;
    END IF;

    IF v_should_sync THEN
        -- Use the sync_employee (new) or sync-to-careflow (old)
        -- The user wanted to fix sync_employee, so let's use that (if it was deployed)
        -- However, since sync_employee deploy is timing out, I'll stick to the one working in production: sync-to-careflow
        v_project_url := 'https://niikshfoecitimepiifo.supabase.co/functions/v1/sync-to-careflow';
        
        -- Service Role Key
        v_service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA1MjIxNSwiZXhwIjoyMDc4NjI4MjE1fQ.sPu18Bb90PKUL_rTDLK6MPvgpS1FfduWq4H0xoNWlA8';
        
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
