-- Check the trigger functions
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.proname IN ('sync_employee_to_careflow', 'audit_trigger_func', 'update_updated_at_column', 'sync_employee_names');
