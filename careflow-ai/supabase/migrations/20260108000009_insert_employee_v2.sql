-- Simplified insert function with explicit table name
CREATE OR REPLACE FUNCTION public.insert_employee_v2(
    p_first_name text,
    p_last_name text,
    p_email text,
    p_status text DEFAULT 'active',
    p_tenant_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
    INSERT INTO public.employees (first_name, last_name, email, status, tenant_id)
    VALUES (p_first_name, p_last_name, p_email, p_status, p_tenant_id)
    RETURNING id;
$$;

GRANT EXECUTE ON FUNCTION public.insert_employee_v2(text, text, text, text, uuid) TO service_role;
