-- Check for RULES on employees table
CREATE OR REPLACE FUNCTION public.debug_check_rules()
RETURNS TABLE(rule_name text, rule_definition text)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        r.rulename::text,
        pg_get_ruledef(r.oid)::text
    FROM pg_rewrite r
    JOIN pg_class c ON r.ev_class = c.oid
    WHERE c.relname = 'employees' 
    AND c.relnamespace = 'public'::regnamespace
    AND r.rulename != '_RETURN';
$$;

GRANT EXECUTE ON FUNCTION public.debug_check_rules() TO service_role;
