-- Migration: 20260108000019_sql_sync_strategy.sql
-- Purpose: Replace unreliable HTTP Edge Function sync with robust direct SQL sync trigger

-- 1. Drop existing HTTP trigger and function
DROP TRIGGER IF EXISTS trg_employee_hired_sync ON employees;
DROP FUNCTION IF EXISTS sync_employee_to_careflow();

-- 2. Create the SQL-based sync function
CREATE OR REPLACE FUNCTION public.sync_employee_to_careflow_direct()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_mapped_role TEXT;
    v_staff_id UUID;
    v_full_name TEXT;
    v_rtw_status TEXT;
    v_dbs_status TEXT;
    v_is_compliant BOOLEAN;
    v_compliance_data JSONB;
BEGIN
    -- Determine if we should sync
    -- Sync on INSERT if status is active
    -- Sync on UPDATE if status changed to active OR if key fields changed for an active employee
    IF (TG_OP = 'INSERT' AND NEW.status != 'active') OR 
       (TG_OP = 'UPDATE' AND NEW.status != 'active' AND OLD.status != 'active') THEN
        RETURN NEW;
    END IF;

    -- 1. Map Role
    -- Default to 'Care Worker' if no mapping found
    SELECT careflow_role INTO v_mapped_role
    FROM role_mappings
    WHERE novumflow_role = NEW.role
    LIMIT 1;
    
    IF v_mapped_role IS NULL THEN
        v_mapped_role := 'Carer'; -- Default fallback
    END IF;

    -- 2. Construct Full Name
    -- Use name if available, otherwise construct from first/last
    v_full_name := COALESCE(NEW.name, TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')));
    IF v_full_name = '' OR v_full_name IS NULL THEN
        v_full_name := 'Unknown Name';
    END IF;

    -- 3. Upsert into careflow_staff
    -- We use the composite unique key (tenant_id, novumflow_employee_id)
    INSERT INTO careflow_staff (
        tenant_id,
        novumflow_employee_id,
        full_name,
        email,
        phone,
        role,
        status, -- 'active' or 'inactive'
        department,
        start_date,
        updated_at
    ) VALUES (
        NEW.tenant_id,
        NEW.id,
        v_full_name,
        NEW.email,
        NEW.phone,
        v_mapped_role,
        CASE WHEN NEW.status = 'active' THEN 'active' ELSE 'inactive' END,
        NEW.department,
        NEW.date_hired,
        NOW()
    )
    ON CONFLICT (tenant_id, novumflow_employee_id) 
    DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        department = EXCLUDED.department,
        updated_at = NOW()
    RETURNING id INTO v_staff_id;

    -- 4. Handle Compliance Sync
    -- Extract compliance data from JSONB column if it exists
    v_compliance_data := NEW.compliance_data;
    
    -- Extract status using JSON accessors, default to 'Pending'
    IF v_compliance_data IS NOT NULL THEN
        v_rtw_status := COALESCE(v_compliance_data->>'right_to_work_status', NEW.right_to_work_status, 'Pending');
        v_dbs_status := COALESCE(v_compliance_data->>'dbs_status', NEW.dbs_status, 'Pending');
    ELSE
        v_rtw_status := COALESCE(NEW.right_to_work_status, 'Pending');
        v_dbs_status := COALESCE(NEW.dbs_status, 'Pending');
    END IF;

    -- Determine overall compliance
    v_is_compliant := (v_rtw_status IN ('Verified', 'Valid')) AND (v_dbs_status IN ('Verified', 'Valid'));

    -- Upsert compliance record
    INSERT INTO careflow_compliance (
        tenant_id,
        staff_id,
        is_compliant,
        compliance_percentage,
        rtw_status,
        dbs_status,
        last_synced_at
    ) VALUES (
        NEW.tenant_id,
        v_staff_id,
        v_is_compliant,
        CASE WHEN v_is_compliant THEN 100 ELSE 50 END,
        CASE WHEN v_rtw_status = 'Verified' THEN 'valid' ELSE 'missing' END,
        CASE WHEN v_dbs_status = 'Verified' THEN 'valid' ELSE 'missing' END,
        NOW()
    )
    ON CONFLICT (staff_id)
    DO UPDATE SET
        is_compliant = EXCLUDED.is_compliant,
        compliance_percentage = EXCLUDED.compliance_percentage,
        rtw_status = EXCLUDED.rtw_status,
        dbs_status = EXCLUDED.dbs_status,
        last_synced_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error to failed_syncs table if it exists, otherwise just raise warning to not block transaction
    -- We don't want to block employee creation if sync fails
    RAISE WARNING 'Sync to CareFlow failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Create the Trigger
CREATE TRIGGER trg_sync_to_careflow_direct
AFTER INSERT OR UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION sync_employee_to_careflow_direct();

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.sync_employee_to_careflow_direct() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_employee_to_careflow_direct() TO authenticated;
-- Important: Use SECURITY DEFINER in the function to ensure it has permission to write to careflow tables
