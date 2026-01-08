-- Check for employees tables across all schemas
CREATE OR REPLACE FUNCTION public.debug_find_employees_tables()
RETURNS TABLE(table_schema text, table_name text, table_type text, has_first_name boolean)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        t.table_schema::text,
        t.table_name::text,
        t.table_type::text,
        EXISTS (
            SELECT 1 FROM information_schema.columns c 
            WHERE c.table_schema = t.table_schema 
            AND c.table_name = t.table_name 
            AND c.column_name = 'first_name'
        ) as has_first_name
    FROM information_schema.tables t
    WHERE t.table_name = 'employees';
$$;

GRANT EXECUTE ON FUNCTION public.debug_find_employees_tables() TO service_role;
