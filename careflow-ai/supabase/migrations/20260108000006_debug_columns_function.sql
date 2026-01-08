-- Create a function to check actual columns
CREATE OR REPLACE FUNCTION public.debug_check_columns()
RETURNS TABLE(column_name text, data_type text, is_nullable text, column_default text)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        column_name::text,
        data_type::text,
        is_nullable::text,
        column_default::text
    FROM information_schema.columns
    WHERE table_name = 'employees'
    AND table_schema = 'public'
    ORDER BY ordinal_position;
$$;

GRANT EXECUTE ON FUNCTION public.debug_check_columns() TO service_role;
