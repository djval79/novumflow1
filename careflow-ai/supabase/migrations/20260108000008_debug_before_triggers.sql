-- Check BEFORE INSERT triggers
CREATE OR REPLACE FUNCTION public.debug_check_before_triggers()
RETURNS TABLE(trigger_name text, timing text, event text, trigger_def text)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        t.tgname::text,
        CASE WHEN t.tgtype & 2 = 2 THEN 'BEFORE' ELSE 'AFTER' END,
        CASE 
            WHEN t.tgtype & 4 = 4 THEN 'INSERT'
            WHEN t.tgtype & 8 = 8 THEN 'DELETE'
            WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
            ELSE 'UNKNOWN'
        END,
        pg_get_triggerdef(t.oid)::text
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'employees'
    AND c.relnamespace = 'public'::regnamespace
    AND NOT t.tgisinternal
    AND t.tgtype & 2 = 2; -- BEFORE triggers only
$$;

GRANT EXECUTE ON FUNCTION public.debug_check_before_triggers() TO service_role;
