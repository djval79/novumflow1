-- ============================================================================
-- MIGRATION 015: TENANT ISOLATION FOR ATTENDANCE, LEAVE, AND HR TABLES
-- ============================================================================
-- This migration adds tenant_id to all remaining HR tables and enforces RLS.
-- ============================================================================

DO $$
BEGIN
    -- 1. ADD TENANT_ID COLUMNS
    
    -- attendance_records
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_records' AND column_name = 'tenant_id') THEN
        ALTER TABLE attendance_records ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    -- leave_requests
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name = 'tenant_id') THEN
        ALTER TABLE leave_requests ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    -- shifts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'tenant_id') THEN
        ALTER TABLE shifts ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    -- employee_shifts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_shifts' AND column_name = 'tenant_id') THEN
        ALTER TABLE employee_shifts ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    -- biometric_enrollment
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'biometric_enrollment' AND column_name = 'tenant_id') THEN
        ALTER TABLE biometric_enrollment ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    -- biometric_attendance_logs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'biometric_attendance_logs' AND column_name = 'tenant_id') THEN
        ALTER TABLE biometric_attendance_logs ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    -- biometric_security_events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'biometric_security_events' AND column_name = 'tenant_id') THEN
        ALTER TABLE biometric_security_events ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_attendance_tenant ON attendance_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant ON leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_tenant ON employee_shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_biometric_enrollment_tenant ON biometric_enrollment(tenant_id);

-- 3. BACKFILL TENANT_ID FROM EMPLOYEES
-- Most of these tables have an employee_id column. We can backfill from there.

-- attendance_records
UPDATE attendance_records ar
SET tenant_id = e.tenant_id
FROM employees e
WHERE ar.employee_id = e.id
AND ar.tenant_id IS NULL;

-- leave_requests
UPDATE leave_requests lr
SET tenant_id = e.tenant_id
FROM employees e
WHERE lr.employee_id = e.id
AND lr.tenant_id IS NULL;

-- employee_shifts
UPDATE employee_shifts es
SET tenant_id = e.tenant_id
FROM employees e
WHERE es.employee_id = e.id
AND es.tenant_id IS NULL;

-- biometric_enrollment
UPDATE biometric_enrollment be
SET tenant_id = e.tenant_id
FROM employees e
WHERE be.employee_id = e.id
AND be.tenant_id IS NULL;

-- biometric_attendance_logs
UPDATE biometric_attendance_logs bal
SET tenant_id = e.tenant_id
FROM employees e
WHERE bal.employee_id = e.id
AND bal.tenant_id IS NULL;

-- biometric_security_events
UPDATE biometric_security_events bse
SET tenant_id = e.tenant_id
FROM employees e
WHERE bse.employee_id = e.id
AND bse.tenant_id IS NULL;

-- For 'shifts' (which is not linked to employee_id directly), 
-- we assign to the default tenant if NULL
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM tenants WHERE subdomain = 'ringsteadcare' LIMIT 1;
    IF default_tenant_id IS NOT NULL THEN
        UPDATE shifts SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;
END $$;

-- 4. HARDEN RLS POLICIES
-- Drop old policies that allow 'true' access

-- attendance_records
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Authenticated users can manage attendance records" ON attendance_records;
DROP POLICY IF EXISTS "auth_all_attendance" ON attendance_records;
CREATE POLICY "tenant_attendance_isolation" ON attendance_records
    FOR ALL TO authenticated USING (user_has_tenant_access(tenant_id));

-- leave_requests
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Authenticated users can manage leave requests" ON leave_requests;
DROP POLICY IF EXISTS "auth_all_leaves" ON leave_requests;
CREATE POLICY "tenant_leave_isolation" ON leave_requests
    FOR ALL TO authenticated USING (user_has_tenant_access(tenant_id));

-- shifts
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view shifts" ON shifts;
DROP POLICY IF EXISTS "Authenticated users can manage shifts" ON shifts;
DROP POLICY IF EXISTS "auth_all_shifts" ON shifts;
CREATE POLICY "tenant_shifts_isolation" ON shifts
    FOR ALL TO authenticated USING (user_has_tenant_access(tenant_id));

-- employee_shifts
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view employee shifts" ON employee_shifts;
DROP POLICY IF EXISTS "Authenticated users can manage employee shifts" ON employee_shifts;
DROP POLICY IF EXISTS "auth_all_employee_shifts" ON employee_shifts;
CREATE POLICY "tenant_employee_shifts_isolation" ON employee_shifts
    FOR ALL TO authenticated USING (user_has_tenant_access(tenant_id));

-- biometric_enrollment
ALTER TABLE biometric_enrollment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view biometric enrollment" ON biometric_enrollment;
DROP POLICY IF EXISTS "Authenticated users can manage biometric enrollment" ON biometric_enrollment;
DROP POLICY IF EXISTS "auth_all_biometric_enrollment" ON biometric_enrollment;
CREATE POLICY "tenant_biometric_enrollment_isolation" ON biometric_enrollment
    FOR ALL TO authenticated USING (user_has_tenant_access(tenant_id));

-- biometric_attendance_logs
ALTER TABLE biometric_attendance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view attendance logs" ON biometric_attendance_logs;
DROP POLICY IF EXISTS "Authenticated users can insert attendance logs" ON biometric_attendance_logs;
DROP POLICY IF EXISTS "auth_all_biometric_attendance" ON biometric_attendance_logs;
CREATE POLICY "tenant_biometric_attendance_isolation" ON biometric_attendance_logs
    FOR ALL TO authenticated USING (user_has_tenant_access(tenant_id));

-- biometric_security_events
ALTER TABLE biometric_security_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view security events" ON biometric_security_events;
DROP POLICY IF EXISTS "Authenticated users can manage security events" ON biometric_security_events;
DROP POLICY IF EXISTS "auth_all_security_events" ON biometric_security_events;
CREATE POLICY "tenant_biometric_security_isolation" ON biometric_security_events
    FOR ALL TO authenticated USING (user_has_tenant_access(tenant_id));
