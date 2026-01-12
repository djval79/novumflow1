-- Fix log_audit_event function to match actual audit_logs table columns
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
    v_changes JSONB;
BEGIN
    -- Get user details
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    
    -- Calculate changes if both old and new values provided
    IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
        SELECT jsonb_object_agg(key, value)
        INTO v_changes
        FROM (
            SELECT key, p_new_values->key as value
            FROM jsonb_object_keys(p_new_values) as key
            WHERE p_old_values->key IS DISTINCT FROM p_new_values->key
        ) changed_fields;
    ELSIF p_new_values IS NOT NULL THEN
        v_changes := p_new_values;
    ELSIF p_old_values IS NOT NULL THEN
        v_changes := p_old_values;
    END IF;
    
    -- Insert using ONLY the columns that exist in audit_logs table
    INSERT INTO audit_logs (
        tenant_id,
        user_id,
        user_email,
        action,
        entity_type,
        entity_id,
        entity_name,
        changes,
        details
    ) VALUES (
        p_tenant_id,
        p_user_id,
        v_user_email,
        p_action,
        p_entity_type,
        p_entity_id,
        p_entity_name,
        v_changes,
        jsonb_build_object(
            'description', p_description,
            'severity', p_severity,
            'is_sensitive', p_is_sensitive,
            'old_values', p_old_values,
            'new_values', p_new_values
        )
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$function$;
