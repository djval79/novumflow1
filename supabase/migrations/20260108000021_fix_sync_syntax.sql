-- Migration: Fix syntax and trigger logic for direct SQL sync

-- 1. Drop existing artifacts to be safe
DROP TRIGGER IF EXISTS trg_sync_to_careflow_direct ON employees;
DROP FUNCTION IF EXISTS sync_employee_to_careflow_direct();

-- 2. Create the function
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
    -- Logic Guard: Only sync active employees
    IF TG_OP = 'INSERT' THEN
        IF NEW.status != 'active' THEN
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- If currently inactive and was inactive, do nothing
        -- (Only sync if it IS active, OR if it WAS active and we need to update status to inactive)
        -- Actually, if it changes FROM active TO inactive, we want to sync that status change.
        -- So if NEW is not active AND OLD was not active, skip.
        IF NEW.status != 'active' AND OLD.status != 'active' THEN
            RETURN NEW;
        END IF;
    END IF;

    -- 1. Map Role (CareFlow uses 'Carer' by default)
    SELECT careflow_role INTO v_mapped_role
    FROM role_mappings
    WHERE novumflow_role = NEW.role
    LIMIT 1;
    
    IF v_mapped_role IS NULL THEN
        v_mapped_role := 'Carer';
    END IF;

    -- 2. Construct Full Name
    v_full_name := COALESCE(NEW.name, TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')));
    IF v_full_name = '' OR v_full_name IS NULL THEN
        v_full_name := 'Unknown Name';
    END IF;

    -- 3. Upsert into careflow_staff
    INSERT INTO careflow_staff (
        tenant_id,
        novumflow_employee_id,
        full_name,
        email,
        phone,
        role,
        status,
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
    v_compliance_data := NEW.compliance_data;
    
    -- Safe access for compliance fields
    IF v_compliance_data IS NOT NULL THEN
        v_rtw_status := COALESCE(v_compliance_data->>'right_to_work_status', NEW.right_to_work_status, 'Pending');
        v_dbs_status := COALESCE(v_compliance_data->>'dbs_status', NEW.dbs_status, 'Pending');
    ELSE
        v_rtw_status := COALESCE(NEW.right_to_work_status, 'Pending');
        v_dbs_status := COALESCE(NEW.dbs_status, 'Pending');
    END IF;

    v_is_compliant := (v_rtw_status IN ('Verified', 'Valid')) AND (v_dbs_status IN ('Verified', 'Valid'));

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
END;
$$;

-- 3. Create Trigger
CREATE TRIGGER trg_sync_to_careflow_direct
AFTER INSERT OR UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION sync_employee_to_careflow_direct();

-- 4. Grant Permissions
GRANT EXECUTE ON FUNCTION public.sync_employee_to_careflow_direct() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_employee_to_careflow_direct() TO authenticated;
