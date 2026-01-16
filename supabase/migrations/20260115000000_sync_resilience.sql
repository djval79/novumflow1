-- Create sync logs table for background retries and audit
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    employee_id UUID REFERENCES employees(id),
    action VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'success', 'failed', 'pending'
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    last_error TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup of failed items
CREATE INDEX IF NOT EXISTS idx_sync_logs_status_retry ON sync_logs(status, retry_count) WHERE status = 'failed';

-- Enable RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Owner policy
CREATE POLICY "Owners can view their sync logs"
ON sync_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_tenant_memberships
        WHERE user_id = auth.uid()
        AND tenant_id = sync_logs.tenant_id
        AND role IN ('owner', 'admin')
    )
);
