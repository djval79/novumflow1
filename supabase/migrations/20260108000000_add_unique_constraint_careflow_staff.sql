-- Add unique constraint to ensure upsert works on careflow_staff
ALTER TABLE public.careflow_staff
ADD CONSTRAINT careflow_staff_novumflow_employee_id_tenant_id_key UNIQUE (novumflow_employee_id, tenant_id);
