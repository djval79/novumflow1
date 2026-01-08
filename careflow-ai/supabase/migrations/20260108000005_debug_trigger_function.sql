-- Create a temporary function to list triggers
CREATE OR REPLACE FUNCTION public.debug_list_triggers()
RETURNS TABLE(trigger_name text, trigger_def text)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        t.tgname::text,
        pg_get_triggerdef(t.oid)::text
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'employees'
    AND c.relnamespace = 'public'::regnamespace
    AND NOT t.tgisinternal;
$$;

GRANT EXECUTE ON FUNCTION public.debug_list_triggers() TO service_role;
