-- Check columns of careflow_compliance
CREATE OR REPLACE FUNCTION public.debug_check_compliance_cols()
RETURNS TABLE(column_name text, data_type text)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT column_name::text, data_type::text
    FROM information_schema.columns
    WHERE table_name = 'careflow_compliance'
    AND table_schema = 'public';
$$;

GRANT EXECUTE ON FUNCTION public.debug_check_compliance_cols() TO service_role;
