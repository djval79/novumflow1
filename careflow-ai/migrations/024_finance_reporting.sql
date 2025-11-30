-- ============================================
-- Phase 7: Reporting & Finance
-- ============================================

-- 1. Add Financial Columns
-- Staff Hourly Rate (Cost)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 15.00;

-- Client Hourly Charge (Revenue)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS hourly_charge DECIMAL(10,2) DEFAULT 25.00;


-- 2. RPC: Get Payroll Report
-- Calculates total pay for each staff member based on completed visits in a date range
CREATE OR REPLACE FUNCTION get_payroll_report(
    p_tenant_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    staff_id UUID,
    first_name TEXT,
    last_name TEXT,
    total_visits BIGINT,
    total_hours DECIMAL,
    total_pay DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id as staff_id,
        e.first_name,
        e.last_name,
        COUNT(v.id) as total_visits,
        SUM(EXTRACT(EPOCH FROM (v.end_time - v.start_time)) / 3600)::DECIMAL(10,2) as total_hours,
        SUM((EXTRACT(EPOCH FROM (v.end_time - v.start_time)) / 3600) * e.hourly_rate)::DECIMAL(10,2) as total_pay
    FROM visits v
    JOIN employees e ON v.staff_id = e.id
    WHERE v.tenant_id = p_tenant_id
    AND v.status = 'Completed'
    AND v.visit_date BETWEEN p_start_date AND p_end_date
    GROUP BY e.id, e.first_name, e.last_name, e.hourly_rate;
END;
$$;


-- 3. RPC: Get Invoice Report
-- Calculates total charge for each client based on completed visits in a date range
CREATE OR REPLACE FUNCTION get_invoice_report(
    p_tenant_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    client_id UUID,
    first_name TEXT,
    last_name TEXT,
    total_visits BIGINT,
    total_hours DECIMAL,
    total_charge DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id as client_id,
        c.first_name,
        c.last_name,
        COUNT(v.id) as total_visits,
        SUM(EXTRACT(EPOCH FROM (v.end_time - v.start_time)) / 3600)::DECIMAL(10,2) as total_hours,
        SUM((EXTRACT(EPOCH FROM (v.end_time - v.start_time)) / 3600) * c.hourly_charge)::DECIMAL(10,2) as total_charge
    FROM visits v
    JOIN clients c ON v.client_id = c.id
    WHERE v.tenant_id = p_tenant_id
    AND v.status = 'Completed'
    AND v.visit_date BETWEEN p_start_date AND p_end_date
    GROUP BY c.id, c.first_name, c.last_name, c.hourly_charge;
END;
$$;
