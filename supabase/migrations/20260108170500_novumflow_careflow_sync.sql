
-- =====================================================================
-- Phase 2.2 & 2.3: NovumFlow -> CareFlow Automated Sync
-- =====================================================================
-- This migration ensures that when staff and compliance data is updated
-- in the recruitment/HR platform (NovumFlow), it automatically flows
-- into the active care delivery platform (CareFlow).

-- 1. Function: Sync Employee to CareFlow Staff
CREATE OR REPLACE FUNCTION public.sync_novumflow_employee_to_careflow()
RETURNS TRIGGER AS $$
DECLARE
    careflow_active BOOLEAN;
BEGIN
    -- Only sync if the tenant has CareFlow enabled
    SELECT (features->>'careflow_enabled')::BOOLEAN INTO careflow_active 
    FROM public.tenants WHERE id = NEW.tenant_id;

    IF careflow_active IS NOT TRUE THEN
        RETURN NEW;
    END IF;

    -- Map NovumFlow status to CareFlow status
    -- NovumFlow: active, on_leave, suspended, terminated
    -- CareFlow: Active, Inactive, On Leave
    INSERT INTO public.careflow_staff (
        tenant_id,
        novumflow_employee_id,
        user_id,
        full_name,
        email,
        phone,
        role,
        status,
        department,
        start_date,
        updated_at
    )
    VALUES (
        NEW.tenant_id,
        NEW.id,
        NEW.user_id,
        NEW.name, -- name is already synced from first_name/last_name in 003_unify_employees_table
        NEW.email,
        NEW.phone,
        COALESCE(NEW.role, NEW.position, 'Carer'),
        CASE 
            WHEN NEW.status = 'active' THEN 'Active'
            WHEN NEW.status = 'on_leave' THEN 'On Leave'
            ELSE 'Inactive'
        END,
        NEW.department,
        NEW.date_hired,
        NOW()
    )
    ON CONFLICT (tenant_id, novumflow_employee_id) 
    DO UPDATE SET
        user_id = EXCLUDED.user_id,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        department = EXCLUDED.department,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger for Employee Sync
DROP TRIGGER IF EXISTS trigger_sync_novumflow_employee ON public.employees;
CREATE TRIGGER trigger_sync_novumflow_employee
    AFTER INSERT OR UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_novumflow_employee_to_careflow();

-- 3. Function: Sync Compliance Records to CareFlow
CREATE OR REPLACE FUNCTION public.sync_novumflow_compliance_to_careflow()
RETURNS TRIGGER AS $$
DECLARE
    v_staff_id UUID;
    v_type TEXT;
    v_name TEXT;
    v_status TEXT;
    v_careflow_active BOOLEAN;
BEGIN
    -- Check if CareFlow is active
    SELECT (features->>'careflow_enabled')::BOOLEAN INTO v_careflow_active 
    FROM public.tenants WHERE id = NEW.tenant_id;

    IF v_careflow_active IS NOT TRUE THEN
        RETURN NEW;
    END IF;

    -- 1. Find the corresponding CareFlow staff ID
    -- We try to find it by novumflow_employee_id (if we have employee_id in source table)
    -- or by user_id if that's what we have.
    IF TG_TABLE_NAME = 'training_records' THEN
        SELECT id INTO v_staff_id FROM public.careflow_staff WHERE novumflow_employee_id = NEW.employee_id AND tenant_id = NEW.tenant_id;
        v_type := 'Training';
        v_name := NEW.training_name;
        v_status := CASE WHEN NEW.status = 'Valid' THEN 'valid' ELSE 'expired' END;
    ELSIF TG_TABLE_NAME = 'dbs_checks' THEN
        -- dbs_checks might use user_id or candidate name
        SELECT id INTO v_staff_id FROM public.careflow_staff WHERE user_id = NEW.user_id AND tenant_id = NEW.tenant_id;
        v_type := 'DBS Check';
        v_name := 'DBS Enhanced Check';
        v_status := CASE WHEN NEW.status = 'clear' THEN 'valid' ELSE 'expired' END;
    ELSIF TG_TABLE_NAME = 'right_to_work_checks' THEN
        SELECT id INTO v_staff_id FROM public.careflow_staff WHERE user_id = NEW.user_id AND tenant_id = NEW.tenant_id;
        v_type := 'Right to Work';
        v_name := NEW.document_type;
        v_status := CASE WHEN NEW.status = 'verified' THEN 'valid' ELSE 'expired' END;
    END IF;

    -- If no staff found, we can't sync compliance yet
    IF v_staff_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Upsert into careflow_compliance
    INSERT INTO public.careflow_compliance (
        tenant_id,
        staff_id,
        novumflow_record_id,
        type,
        name,
        status,
        issue_date,
        expiry_date,
        document_url,
        updated_at
    )
    VALUES (
        NEW.tenant_id,
        v_staff_id,
        NEW.id,
        v_type,
        v_name,
        v_status,
        CASE WHEN TG_TABLE_NAME = 'training_records' THEN NEW.completion_date ELSE (CASE WHEN TG_TABLE_NAME = 'dbs_checks' THEN NEW.issue_date ELSE NEW.check_date END) END,
        CASE WHEN TG_TABLE_NAME = 'right_to_work_checks' THEN NEW.visa_expiry ELSE (CASE WHEN TG_TABLE_NAME = 'dbs_checks' THEN NEW.expiry_date ELSE NEW.expiry_date END) END,
        CASE WHEN TG_TABLE_NAME = 'right_to_work_checks' THEN NEW.document_url ELSE (CASE WHEN TG_TABLE_NAME = 'dbs_checks' THEN NEW.document_url ELSE NEW.certificate_url END) END,
        NOW()
    )
    ON CONFLICT (tenant_id, novumflow_record_id)
    DO UPDATE SET
        status = EXCLUDED.status,
        expiry_date = EXCLUDED.expiry_date,
        document_url = EXCLUDED.document_url,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Triggers for Compliance Sync
DROP TRIGGER IF EXISTS trigger_sync_training_to_careflow ON public.training_records;
CREATE TRIGGER trigger_sync_training_to_careflow
    AFTER INSERT OR UPDATE ON public.training_records
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_novumflow_compliance_to_careflow();

DROP TRIGGER IF EXISTS trigger_sync_dbs_to_careflow ON public.dbs_checks;
CREATE TRIGGER trigger_sync_dbs_to_careflow
    AFTER INSERT OR UPDATE ON public.dbs_checks
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_novumflow_compliance_to_careflow();

DROP TRIGGER IF EXISTS trigger_sync_rtw_to_careflow ON public.right_to_work_checks;
CREATE TRIGGER trigger_sync_rtw_to_careflow
    AFTER INSERT OR UPDATE ON public.right_to_work_checks
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_novumflow_compliance_to_careflow();

-- 5. Backfill Existing Data
DO $$
BEGIN
    -- Notify that the triggers are set for future updates
    RAISE NOTICE '✅ NovumFlow -> CareFlow sync triggers established.';
    
    -- We could run an initial sync here if tables have data
    -- (Omitted for safety unless requested, but usually recommended)
END $$;
