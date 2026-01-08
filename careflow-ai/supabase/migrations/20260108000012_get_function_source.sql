-- Get the full definition of sync_employee_to_careflow function
CREATE OR REPLACE FUNCTION public.debug_get_function_source()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT pg_get_functiondef(oid)::text
    FROM pg_proc
    WHERE proname = 'sync_employee_to_careflow'
    AND pronamespace = 'public'::regnamespace;
$$;

GRANT EXECUTE ON FUNCTION public.debug_get_function_source() TO service_role;
