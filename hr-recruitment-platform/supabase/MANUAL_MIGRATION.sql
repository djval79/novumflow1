-- =====================================================
-- COMBINED MIGRATION SCRIPT
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- ============================================
-- PART 1: ADD TENANT_ID TO ATTENDANCE/LEAVE
-- ============================================

-- Add tenant_id column to attendance_records if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE attendance_records 
        ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_attendance_records_tenant_id 
        ON attendance_records(tenant_id);
        
        CREATE INDEX IF NOT EXISTS idx_attendance_records_tenant_date 
        ON attendance_records(tenant_id, date);
    END IF;
END $$;

-- Add tenant_id column to leave_requests if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE leave_requests 
        ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_id 
        ON leave_requests(tenant_id);
        
        CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_status 
        ON leave_requests(tenant_id, status);
    END IF;
END $$;

-- Backfill tenant_id from employees table
UPDATE attendance_records ar
SET tenant_id = e.tenant_id
FROM employees e
WHERE ar.employee_id = e.id 
  AND ar.tenant_id IS NULL;

UPDATE leave_requests lr
SET tenant_id = e.tenant_id
FROM employees e
WHERE lr.employee_id = e.id 
  AND lr.tenant_id IS NULL;

-- Enable RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy for attendance_records
DROP POLICY IF EXISTS attendance_tenant_isolation ON attendance_records;
CREATE POLICY attendance_tenant_isolation ON attendance_records
    FOR ALL
    USING (
        tenant_id = (
            SELECT up.tenant_id FROM public.users_profiles up
            WHERE up.user_id = auth.uid()
            LIMIT 1
        )
    );

-- RLS Policy for leave_requests
DROP POLICY IF EXISTS leave_tenant_isolation ON leave_requests;
CREATE POLICY leave_tenant_isolation ON leave_requests
    FOR ALL
    USING (
        tenant_id = (
            SELECT up.tenant_id FROM public.users_profiles up
            WHERE up.user_id = auth.uid()
            LIMIT 1
        )
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leave_requests TO authenticated;

-- ============================================
-- PART 2: SECURITY AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_logs_tenant 
ON security_audit_logs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_security_logs_severity 
ON security_audit_logs(severity);

CREATE INDEX IF NOT EXISTS idx_security_logs_created 
ON security_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_logs_event_type 
ON security_audit_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_security_logs_tenant_severity_created 
ON security_audit_logs(tenant_id, severity, created_at DESC);

ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS security_logs_tenant_isolation ON security_audit_logs;
CREATE POLICY security_logs_tenant_isolation ON security_audit_logs
    FOR SELECT
    USING (
        tenant_id = (
            SELECT up.tenant_id FROM public.users_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role IN ('admin', 'owner')
            LIMIT 1
        )
    );

DROP POLICY IF EXISTS security_logs_insert ON security_audit_logs;
CREATE POLICY security_logs_insert ON security_audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT ON security_audit_logs TO authenticated;

-- ============================================
-- DONE! Both migrations applied.
-- ============================================
