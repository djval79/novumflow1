-- Drop ALL triggers on employees to isolate
DROP TRIGGER IF EXISTS trg_employee_hired_sync ON employees;
DROP TRIGGER IF EXISTS trigger_sync_employee_names ON employees;
DROP TRIGGER IF EXISTS on_auth_user_created ON employees;
DROP TRIGGER IF EXISTS on_employee_status_change ON employees;
