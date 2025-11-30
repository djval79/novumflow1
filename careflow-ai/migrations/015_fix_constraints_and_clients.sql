-- ============================================
-- Phase 2 Fix: Add Unique Constraint
-- ============================================

-- Ensure novumflow_employee_id is unique for upserts to work
ALTER TABLE employees 
ADD CONSTRAINT employees_novumflow_employee_id_key UNIQUE (novumflow_employee_id);
