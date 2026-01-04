-- Migration: Audit Trail & Activity Logging
-- For compliance, accountability, and change tracking

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Who
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    user_name TEXT,
    
    -- What
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'login', 'logout', 'export', 'import'
    entity_type TEXT NOT NULL, -- 'employee', 'client', 'incident', 'document', 'shift', 'expense', etc.
    entity_id UUID, -- ID of the affected record
    entity_name TEXT, -- Human-readable name for display
    
    -- Details
    old_values JSONB, -- Previous values (for updates/deletes)
    new_values JSONB, -- New values (for creates/updates)
    changes JSONB, -- Just the changed fields for quick reference
    
    -- Context
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    
    -- Additional info
    description TEXT, -- Human-readable description
    metadata JSONB DEFAULT '{}', -- Any additional context
    
    -- Severity/Classification
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
    is_sensitive BOOLEAN DEFAULT FALSE, -- Flag for sensitive data access
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create partitions for performance (by month)
-- Note: In production, you'd want to automate partition creation

-- System Activity Log (for system-level events, not tenant-specific)
CREATE TABLE IF NOT EXISTS system_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What
    event_type TEXT NOT NULL, -- 'cron_job', 'migration', 'backup', 'error', 'performance'
    event_name TEXT NOT NULL,
    
    -- Details
    status TEXT DEFAULT 'success', -- 'success', 'failure', 'warning'
    message TEXT,
    error_details TEXT,
    duration_ms INTEGER,
    
    -- Context
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Login History
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Event
    event_type TEXT NOT NULL, -- 'login_success', 'login_failed', 'logout', 'password_reset', 'mfa_triggered'
    
    -- Context
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,
    location TEXT, -- Approximate location from IP
    
    -- Security flags
    is_suspicious BOOLEAN DEFAULT FALSE,
    failure_reason TEXT, -- For failed logins
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_activity_created ON system_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at DESC);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Audit Logs policies
CREATE POLICY "Tenant users can view audit logs"
ON audit_logs FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- System admins only for system logs (no policy = no access via RLS)
-- Access via service_role only

-- Login History policies
CREATE POLICY "Users can view their own login history"
ON login_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Tenant admins can view all login history"
ON login_history FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM users_profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_tenant_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_entity_name TEXT DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'info',
    p_is_sensitive BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_user_email TEXT;
    v_user_name TEXT;
    v_changes JSONB;
BEGIN
    -- Get user details
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    SELECT CONCAT(first_name, ' ', last_name) INTO v_user_name 
    FROM users_profiles WHERE id = p_user_id;
    
    -- Calculate changes if both old and new values provided
    IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
        SELECT jsonb_object_agg(key, value)
        INTO v_changes
        FROM (
            SELECT key, p_new_values->key as value
            FROM jsonb_object_keys(p_new_values) as key
            WHERE p_old_values->key IS DISTINCT FROM p_new_values->key
        ) changed_fields;
    END IF;
    
    INSERT INTO audit_logs (
        tenant_id,
        user_id,
        user_email,
        user_name,
        action,
        entity_type,
        entity_id,
        entity_name,
        old_values,
        new_values,
        changes,
        description,
        severity,
        is_sensitive
    ) VALUES (
        p_tenant_id,
        p_user_id,
        v_user_email,
        v_user_name,
        p_action,
        p_entity_type,
        p_entity_id,
        p_entity_name,
        p_old_values,
        p_new_values,
        v_changes,
        COALESCE(p_description, p_action || ' ' || p_entity_type),
        p_severity,
        p_is_sensitive
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic trigger function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_action TEXT;
    v_old_data JSONB;
    v_new_data JSONB;
    v_entity_name TEXT;
    v_tenant_id UUID;
    v_user_id UUID;
BEGIN
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
        v_new_data := to_jsonb(NEW);
        v_old_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'update';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'delete';
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
    END IF;
    
    -- Get tenant_id (try different column names)
    v_tenant_id := COALESCE(
        (v_new_data->>'tenant_id')::UUID,
        (v_old_data->>'tenant_id')::UUID
    );
    
    -- Get user_id from session
    v_user_id := auth.uid();
    
    -- Try to get entity name
    v_entity_name := COALESCE(
        v_new_data->>'name',
        v_new_data->>'title',
        CONCAT(v_new_data->>'first_name', ' ', v_new_data->>'last_name'),
        v_old_data->>'name',
        v_old_data->>'title',
        CONCAT(v_old_data->>'first_name', ' ', v_old_data->>'last_name')
    );
    
    -- Only log if we have a tenant
    IF v_tenant_id IS NOT NULL THEN
        PERFORM log_audit_event(
            v_tenant_id,
            v_user_id,
            v_action,
            TG_TABLE_NAME,
            COALESCE(
                (v_new_data->>'id')::UUID,
                (v_old_data->>'id')::UUID
            ),
            v_entity_name,
            v_old_data,
            v_new_data
        );
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for important tables
-- (Run these selectively based on compliance needs)

-- Employees audit
DROP TRIGGER IF EXISTS audit_employees ON employees;
CREATE TRIGGER audit_employees
    AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Clients audit
DROP TRIGGER IF EXISTS audit_clients ON clients;
CREATE TRIGGER audit_clients
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Incidents audit
DROP TRIGGER IF EXISTS audit_incidents ON incidents;
CREATE TRIGGER audit_incidents
    AFTER INSERT OR UPDATE OR DELETE ON incidents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Expense Claims audit
DROP TRIGGER IF EXISTS audit_expense_claims ON expense_claims;
CREATE TRIGGER audit_expense_claims
    AFTER INSERT OR UPDATE OR DELETE ON expense_claims
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Grants
GRANT ALL ON audit_logs TO service_role;
GRANT ALL ON system_activity_logs TO service_role;
GRANT ALL ON login_history TO service_role;
GRANT EXECUTE ON FUNCTION log_audit_event TO service_role;
