-- ============================================
-- Phase 2: Enforce Compliance (Block Visits)
-- ============================================

-- 1. Create Function to Check Compliance
CREATE OR REPLACE FUNCTION check_staff_compliance()
RETURNS TRIGGER AS $$
DECLARE
    v_staff_compliance RECORD;
    v_tenant_settings JSONB;
    v_block_rtw BOOLEAN;
    v_block_dbs BOOLEAN;
BEGIN
    -- Only check if staff_id is present and changed
    IF NEW.staff_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get Tenant Settings
    SELECT settings INTO v_tenant_settings
    FROM tenants
    WHERE id = NEW.tenant_id;

    -- Determine if blocks are enabled (default: true unless explicitly disabled)
    -- Use COALESCE to handle case where disabled_features key is missing or null
    v_block_rtw := NOT (COALESCE(v_tenant_settings->'disabled_features', '[]'::jsonb) @> '"block_rtw"');
    v_block_dbs := NOT (COALESCE(v_tenant_settings->'disabled_features', '[]'::jsonb) @> '"block_dbs"');

    -- Get Staff Compliance Status
    SELECT 
        right_to_work_status, 
        right_to_work_expiry,
        dbs_status,
        dbs_expiry
    INTO v_staff_compliance
    FROM employees
    WHERE id = NEW.staff_id;

    -- Check Right to Work
    IF v_block_rtw THEN
        IF v_staff_compliance.right_to_work_status IN ('Missing', 'Expired', 'Pending') OR v_staff_compliance.right_to_work_status IS NULL THEN
            RAISE EXCEPTION 'Compliance Block: Staff member has invalid Right to Work status (%)', v_staff_compliance.right_to_work_status;
        END IF;

        IF v_staff_compliance.right_to_work_expiry < CURRENT_DATE THEN
            RAISE EXCEPTION 'Compliance Block: Staff member Right to Work has expired on %', v_staff_compliance.right_to_work_expiry;
        END IF;
    END IF;

    -- Check DBS
    IF v_block_dbs THEN
        IF v_staff_compliance.dbs_status IN ('Flagged', 'Expired', 'Pending') OR v_staff_compliance.dbs_status IS NULL THEN
             RAISE EXCEPTION 'Compliance Block: Staff member has invalid DBS status (%)', v_staff_compliance.dbs_status;
        END IF;

        IF v_staff_compliance.dbs_expiry < CURRENT_DATE THEN
            RAISE EXCEPTION 'Compliance Block: Staff member DBS has expired on %', v_staff_compliance.dbs_expiry;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create Trigger on Visits
DROP TRIGGER IF EXISTS check_visit_compliance ON visits;

CREATE TRIGGER check_visit_compliance
    BEFORE INSERT OR UPDATE OF staff_id
    ON visits
    FOR EACH ROW
    EXECUTE FUNCTION check_staff_compliance();
