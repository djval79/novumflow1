-- Migration: Cleanup debug functions
DROP FUNCTION IF EXISTS public.debug_list_triggers(text);
DROP FUNCTION IF EXISTS public.debug_list_triggers();
DROP FUNCTION IF EXISTS public.debug_check_columns();
DROP FUNCTION IF EXISTS public.insert_employee(text, text, text, text, uuid);
DROP FUNCTION IF EXISTS public.debug_check_before_triggers();
DROP FUNCTION IF EXISTS public.insert_employee_v2(text, text, text, text, uuid);
DROP FUNCTION IF EXISTS public.debug_find_employees_tables();
DROP FUNCTION IF EXISTS public.debug_check_rules();
DROP FUNCTION IF EXISTS public.debug_get_function_source();
DROP FUNCTION IF EXISTS public.debug_get_audit_func();
DROP FUNCTION IF EXISTS public.debug_get_log_audit_func();
DROP FUNCTION IF EXISTS public.debug_check_users_profiles();
DROP FUNCTION IF EXISTS public.debug_careflow_staff_constraints();
DROP FUNCTION IF EXISTS public.debug_check_compliance_cols();
DROP FUNCTION IF EXISTS public.debug_compliance_constraints();
