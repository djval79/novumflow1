-- Fix log_audit_event function to use correct column name
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_tenant_id uuid, 
    p_user_id uuid, 
    p_action text, 
    p_entity_type text, 
    p_entity_id uuid DEFAULT NULL::uuid, 
    p_entity_name text DEFAULT NULL::text, 
    p_old_values jsonb DEFAULT NULL::jsonb, 
    p_new_values jsonb DEFAULT NULL::jsonb, 
    p_description text DEFAULT NULL::text, 
    p_severity text DEFAULT 'info'::text, 
    p_is_sensitive boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_log_id UUID;
    v_user_email TEXT;
    v_user_name TEXT;
    v_changes JSONB;
BEGIN
    -- Get user details
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    
    -- FIXED: Use full_name instead of first_name/last_name
    SELECT full_name INTO v_user_name 
    FROM users_profiles WHERE user_id = p_user_id;
    
    -- Calculate changes if both old and new values provided
    IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
        SELECT jsonb_object_agg(key, value)
        INTO v_changes
        FROM (
            SELECT key, p_new_values->key as value
            FROM jsonb_object_keys(p_new_values) as key
            WHERE p_old_values->key IS DISTINCT FROM p_new_values->key
        ) changed_fields;
    END IF;
    
    INSERT INTO audit_logs (
        tenant_id,
        user_id,
        user_email,
        user_name,
        action,
        entity_type,
        entity_id,
        entity_name,
        old_values,
        new_values,
        changes,
        description,
        severity,
        is_sensitive
    ) VALUES (
        p_tenant_id,
        p_user_id,
        v_user_email,
        v_user_name,
        p_action,
        p_entity_type,
        p_entity_id,
        p_entity_name,
        p_old_values,
        p_new_values,
        v_changes,
        COALESCE(p_description, p_action || ' ' || p_entity_type),
        p_severity,
        p_is_sensitive
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$function$;
