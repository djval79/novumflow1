
-- Fix for sync_novumflow_employee_to_careflow (Robust Name Handling)
CREATE OR REPLACE FUNCTION public.sync_novumflow_employee_to_careflow()
RETURNS TRIGGER AS $$
DECLARE
    careflow_active BOOLEAN;
    v_full_name TEXT;
BEGIN
    -- Only sync if the tenant has CareFlow enabled
    SELECT (features->>'careflow_enabled')::BOOLEAN INTO careflow_active 
    FROM public.tenants WHERE id = NEW.tenant_id;

    IF careflow_active IS NOT TRUE THEN
        RETURN NEW;
    END IF;

    -- Robust name handling: use NEW.name if present, otherwise reconstruct it
    v_full_name := TRIM(COALESCE(NEW.name, COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')));
    
    -- If we still don't have a name, use email as fallback to avoid not-null constraint failure
    IF v_full_name = '' OR v_full_name IS NULL THEN
        v_full_name := NEW.email;
    END IF;

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
        v_full_name,
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

-- Fix for sync_novumflow_compliance_to_careflow (Robust Date/Field Handling)
CREATE OR REPLACE FUNCTION public.sync_novumflow_compliance_to_careflow()
RETURNS TRIGGER AS $$
DECLARE
    v_staff_id UUID;
    v_type TEXT;
    v_name TEXT;
    v_status TEXT;
    v_issue_date DATE;
    v_expiry_date DATE;
    v_doc_url TEXT;
    v_careflow_active BOOLEAN;
BEGIN
    -- Check if CareFlow is active
    SELECT (features->>'careflow_enabled')::BOOLEAN INTO v_careflow_active 
    FROM public.tenants WHERE id = NEW.tenant_id;

    IF v_careflow_active IS NOT TRUE THEN
        RETURN NEW;
    END IF;

    -- 1. Table-specific mappings
    IF TG_TABLE_NAME = 'training_records' THEN
        SELECT id INTO v_staff_id FROM public.careflow_staff WHERE novumflow_employee_id = NEW.employee_id AND tenant_id = NEW.tenant_id;
        v_type := 'Training';
        v_name := NEW.training_name;
        v_status := CASE WHEN NEW.status = 'Valid' THEN 'valid' ELSE 'expired' END;
        v_issue_date := NEW.completion_date;
        v_expiry_date := NEW.expiry_date;
        v_doc_url := NEW.certificate_url;
    ELSIF TG_TABLE_NAME = 'dbs_checks' THEN
        SELECT id INTO v_staff_id FROM public.careflow_staff WHERE user_id = NEW.user_id AND tenant_id = NEW.tenant_id;
        v_type := 'DBS Check';
        v_name := 'DBS Enhanced Check';
        v_status := CASE WHEN NEW.status = 'clear' THEN 'valid' ELSE 'expired' END;
        v_issue_date := NEW.issue_date;
        v_expiry_date := NEW.expiry_date;
        v_doc_url := NEW.document_url;
    ELSIF TG_TABLE_NAME = 'right_to_work_checks' THEN
        SELECT id INTO v_staff_id FROM public.careflow_staff WHERE user_id = NEW.user_id AND tenant_id = NEW.tenant_id;
        v_type := 'Right to Work';
        v_name := NEW.document_type;
        v_status := CASE WHEN NEW.status = 'verified' THEN 'valid' ELSE 'expired' END;
        v_issue_date := NEW.check_date;
        v_expiry_date := NEW.visa_expiry;
        v_doc_url := NEW.document_url;
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
        v_issue_date,
        v_expiry_date,
        v_doc_url,
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
