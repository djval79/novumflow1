-- Create a function to insert employees directly (bypassing PostgREST validation)
CREATE OR REPLACE FUNCTION public.insert_employee(
    p_first_name text,
    p_last_name text,
    p_email text,
    p_status text DEFAULT 'active',
    p_tenant_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id uuid;
BEGIN
    INSERT INTO employees (first_name, last_name, email, status, tenant_id)
    VALUES (p_first_name, p_last_name, p_email, p_status, p_tenant_id)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_employee(text, text, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.insert_employee(text, text, text, text, uuid) TO authenticated;
