-- Migration: Fix compliance sync logic to match actual schema

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
    v_compliance_data JSONB;
BEGIN
    -- Logic Guard: Only sync active employees
    IF TG_OP = 'INSERT' THEN
        IF NEW.status != 'active' THEN
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status != 'active' AND OLD.status != 'active' THEN
            RETURN NEW;
        END IF;
    END IF;

    -- 1. Map Role
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

    -- 4. Handle Compliance Sync (Right to Work & DBS)
    v_compliance_data := NEW.compliance_data;
    
    IF v_compliance_data IS NOT NULL THEN
        v_rtw_status := COALESCE(v_compliance_data->>'right_to_work_status', NEW.right_to_work_status, 'Pending');
        v_dbs_status := COALESCE(v_compliance_data->>'dbs_status', NEW.dbs_status, 'Pending');
    ELSE
        v_rtw_status := COALESCE(NEW.right_to_work_status, 'Pending');
        v_dbs_status := COALESCE(NEW.dbs_status, 'Pending');
    END IF;

    -- Right to Work
    UPDATE careflow_compliance 
    SET status = CASE WHEN v_rtw_status IN ('Verified', 'Valid') THEN 'Valid' ELSE 'Pending' END,
        updated_at = NOW()
    WHERE staff_id = v_staff_id AND type = 'Right to Work';

    IF NOT FOUND THEN
        INSERT INTO careflow_compliance (tenant_id, staff_id, type, name, status, created_at, updated_at)
        VALUES (NEW.tenant_id, v_staff_id, 'Right to Work', 'Right to Work Check', 
               CASE WHEN v_rtw_status IN ('Verified', 'Valid') THEN 'Valid' ELSE 'Pending' END, NOW(), NOW());
    END IF;

    -- DBS
    UPDATE careflow_compliance 
    SET status = CASE WHEN v_dbs_status IN ('Verified', 'Valid') THEN 'Valid' ELSE 'Pending' END,
        updated_at = NOW()
    WHERE staff_id = v_staff_id AND type = 'DBS';

    IF NOT FOUND THEN
        INSERT INTO careflow_compliance (tenant_id, staff_id, type, name, status, created_at, updated_at)
        VALUES (NEW.tenant_id, v_staff_id, 'DBS', 'DBS Check', 
               CASE WHEN v_dbs_status IN ('Verified', 'Valid') THEN 'Valid' ELSE 'Pending' END, NOW(), NOW());
    END IF;

    RETURN NEW;
END;
$$;
