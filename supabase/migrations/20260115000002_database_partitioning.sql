-- Migration 018: Database Partitioning & Scaling
-- Implements range partitioning for high-growth log tables (Audit & Sync).

-- 1. Create Compliance Audit Logs (Partitioned)
-- We use Range partitioning on created_at for easy archiving/dropping of old logs.

DO $$ 
BEGIN
    -- If it exists as a normal table, rename it to preserve data
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'compliance_audit_logs' AND schemaname = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'compliance_audit_logs' AND c.relkind = 'p') THEN
            ALTER TABLE compliance_audit_logs RENAME TO compliance_audit_logs_old;
        END IF;
    END IF;

    -- Create Partitioned Table
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'compliance_audit_logs' AND c.relkind = 'p') THEN
        CREATE TABLE compliance_audit_logs (
            id UUID NOT NULL DEFAULT gen_random_uuid(),
            tenant_id UUID,
            action TEXT NOT NULL,
            entity TEXT NOT NULL,
            entity_id TEXT,
            actor_id UUID,
            ip_address TEXT,
            user_agent TEXT,
            metadata JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (id, created_at)
        ) PARTITION BY RANGE (created_at);

        -- Create Initial Partitions
        CREATE TABLE compliance_audit_logs_2026_q1 PARTITION OF compliance_audit_logs
            FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
        
        CREATE TABLE compliance_audit_logs_2026_q2 PARTITION OF compliance_audit_logs
            FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

        -- Migrate data if old table existed
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'compliance_audit_logs_old' AND schemaname = 'public') THEN
            INSERT INTO compliance_audit_logs SELECT * FROM compliance_audit_logs_old;
            DROP TABLE compliance_audit_logs_old;
        END IF;
    END IF;
END $$;

-- 2. Partition Sync Logs
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sync_logs' AND schemaname = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'sync_logs' AND c.relkind = 'p') THEN
            ALTER TABLE sync_logs RENAME TO sync_logs_old;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'sync_logs' AND c.relkind = 'p') THEN
        CREATE TABLE sync_logs (
            id UUID NOT NULL DEFAULT gen_random_uuid(),
            tenant_id UUID REFERENCES tenants(id),
            employee_id UUID REFERENCES employees(id),
            action VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            retry_count INT DEFAULT 0,
            max_retries INT DEFAULT 3,
            last_error TEXT,
            metadata JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (id, created_at)
        ) PARTITION BY RANGE (created_at);

        -- Create Initial Partitions
        CREATE TABLE sync_logs_2026_01 PARTITION OF sync_logs
            FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
        
        CREATE TABLE sync_logs_2026_02 PARTITION OF sync_logs
            FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sync_logs_old' AND schemaname = 'public') THEN
            INSERT INTO sync_logs SELECT * FROM sync_logs_old;
            DROP TABLE sync_logs_old;
        END IF;
    END IF;
END $$;

-- 3. Automation: Auto-partitioning Function
CREATE OR REPLACE FUNCTION maintain_log_partitions()
RETURNS void AS $$
DECLARE
    next_month DATE := date_trunc('month', now() + interval '1 month');
    partition_name TEXT;
    start_date TEXT;
    end_date TEXT;
BEGIN
    -- For Sync Logs (Monthly)
    partition_name := 'sync_logs_' || to_char(next_month, 'YYYY_MM');
    start_date := to_char(next_month, 'YYYY-MM-DD');
    end_date := to_char(next_month + interval '1 month', 'YYYY-MM-DD');

    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = partition_name) THEN
        EXECUTE format('CREATE TABLE %I PARTITION OF sync_logs FOR VALUES FROM (%L) TO (%L)', partition_name, start_date, end_date);
    END IF;

    -- For Compliance Logs (Quarterly)
    -- Logic for next quarter if needed...
END;
$$ LANGUAGE plpgsql;

-- 4. RLS Re-application (Partitioned tables need RLS on the parent)
ALTER TABLE compliance_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can access compliance audit logs" ON compliance_audit_logs;
CREATE POLICY "Anyone can access compliance audit logs" ON compliance_audit_logs
    FOR SELECT USING (true); -- Enterprise/Admin specific policies should be added here

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view their sync logs" ON sync_logs;
CREATE POLICY "Owners can view their sync logs" ON sync_logs 
    FOR SELECT USING (public.user_has_tenant_access(tenant_id));
