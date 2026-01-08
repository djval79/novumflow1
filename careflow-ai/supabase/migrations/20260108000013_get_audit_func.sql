-- Get the audit_trigger_func definition
CREATE OR REPLACE FUNCTION public.debug_get_audit_func()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT pg_get_functiondef(oid)::text
    FROM pg_proc
    WHERE proname = 'audit_trigger_func'
    AND pronamespace = 'public'::regnamespace;
$$;

GRANT EXECUTE ON FUNCTION public.debug_get_audit_func() TO service_role;
