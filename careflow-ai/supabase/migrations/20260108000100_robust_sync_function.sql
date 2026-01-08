-- Migration: Final robust sync function
-- Enhancements:
-- 1. Case-insensitive status checks (Active/active)
-- 2. Robust name construction
-- 3. Avatar URL fetching from users_profiles
-- 4. Case-insensitive role mapping lookup

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
    v_avatar_url TEXT;
BEGIN
    -- Logic Guard: Only sync active employees (case insensitive)
    IF TG_OP = 'INSERT' THEN
        IF LOWER(NEW.status) != 'active' THEN
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF LOWER(NEW.status) != 'active' AND LOWER(OLD.status) != 'active' THEN
            RETURN NEW;
        END IF;
    END IF;

    -- 1. Map Role (Case insensitive lookup)
    SELECT careflow_role INTO v_mapped_role
    FROM role_mappings
    WHERE LOWER(novumflow_role) = LOWER(NEW.role)
    LIMIT 1;
    
    IF v_mapped_role IS NULL THEN
        v_mapped_role := 'Carer';
    END IF;

    -- 2. Construct Full Name
    v_full_name := COALESCE(NEW.name, TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')));
    IF v_full_name = '' OR v_full_name IS NULL THEN
        v_full_name := 'Unknown Name';
    END IF;

    -- 3. Fetch Avatar if user linked
    v_avatar_url := NULL;
    IF NEW.user_id IS NOT NULL THEN
        SELECT avatar_url INTO v_avatar_url
        FROM users_profiles
        WHERE user_id = NEW.user_id;
    END IF;

    -- 4. Upsert into careflow_staff
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
        avatar_url,
        updated_at
    ) VALUES (
        NEW.tenant_id,
        NEW.id,
        v_full_name,
        NEW.email,
        NEW.phone,
        v_mapped_role,
        CASE WHEN LOWER(NEW.status) = 'active' THEN 'active' ELSE 'inactive' END,
        NEW.department,
        NEW.date_hired,
        v_avatar_url,
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
        avatar_url = COALESCE(EXCLUDED.avatar_url, careflow_staff.avatar_url),
        updated_at = NOW()
    RETURNING id INTO v_staff_id;

    -- 5. Handle Compliance Sync (Right to Work & DBS)
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
