-- Check users_profiles table columns
CREATE OR REPLACE FUNCTION public.debug_check_users_profiles()
RETURNS TABLE(column_name text, data_type text)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT column_name::text, data_type::text
    FROM information_schema.columns
    WHERE table_name = 'users_profiles'
    AND table_schema = 'public';
$$;

GRANT EXECUTE ON FUNCTION public.debug_check_users_profiles() TO service_role;
