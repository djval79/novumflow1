-- Get the log_audit_event function definition
CREATE OR REPLACE FUNCTION public.debug_get_log_audit_func()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        COALESCE(
            pg_get_functiondef(oid),
            'Function not found'
        )::text
    FROM pg_proc
    WHERE proname = 'log_audit_event'
    AND pronamespace = 'public'::regnamespace
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.debug_get_log_audit_func() TO service_role;
