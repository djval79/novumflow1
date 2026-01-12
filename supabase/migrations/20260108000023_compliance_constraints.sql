-- Check constraints for careflow_compliance
CREATE OR REPLACE FUNCTION public.debug_compliance_constraints()
RETURNS TABLE(constraint_name text, constraint_type text, constraint_definition text)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        c.conname::text,
        c.contype::text,
        pg_get_constraintdef(c.oid)::text
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'careflow_compliance'
    AND t.relnamespace = 'public'::regnamespace;
$$;

GRANT EXECUTE ON FUNCTION public.debug_compliance_constraints() TO service_role;
