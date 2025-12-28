-- Migration: Create security_audit_logs table
-- For logging security events from the frontend logger

-- ============================================
-- SECURITY AUDIT LOGS TABLE
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

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_logs_tenant 
ON security_audit_logs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_security_logs_severity 
ON security_audit_logs(severity);

CREATE INDEX IF NOT EXISTS idx_security_logs_created 
ON security_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_logs_event_type 
ON security_audit_logs(event_type);

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_security_logs_tenant_severity_created 
ON security_audit_logs(tenant_id, severity, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's security logs
-- Restricted to admin/owner roles for security
DROP POLICY IF EXISTS security_logs_tenant_isolation ON security_audit_logs;
CREATE POLICY security_logs_tenant_isolation ON security_audit_logs
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'owner')
        )
    );

-- Policy: Allow inserts from authenticated users
DROP POLICY IF EXISTS security_logs_insert ON security_audit_logs;
CREATE POLICY security_logs_insert ON security_audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- PERMISSIONS
-- ============================================

GRANT SELECT, INSERT ON security_audit_logs TO authenticated;
