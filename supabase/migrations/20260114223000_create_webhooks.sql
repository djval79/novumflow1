-- Webhook System Tables
-- Allows tenants to subscribe to events like employee.created, application.status_changed

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret TEXT, -- For signing payloads
    events TEXT[] NOT NULL, -- e.g. ["employee.created", "employee.updated"]
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'success', 'failed'
    response_code INTEGER,
    response_body TEXT,
    attempt_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);

-- RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their tenant webhooks" ON webhooks;
CREATE POLICY "Users can manage their tenant webhooks" ON webhooks
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Users can view their tenant webhook logs" ON webhook_deliveries;
CREATE POLICY "Users can view their tenant webhook logs" ON webhook_deliveries
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Trigger Function to Dispatch Webhooks
CREATE OR REPLACE FUNCTION trigger_webhook_event()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type TEXT;
    v_payload JSONB;
    v_webhook RECORD;
BEGIN
    -- Determine Event Type
    IF TG_TABLE_NAME = 'employees' THEN
        IF TG_OP = 'INSERT' THEN v_event_type := 'employee.created';
        ELSIF TG_OP = 'UPDATE' THEN v_event_type := 'employee.updated';
        END IF;
    ELSIF TG_TABLE_NAME = 'applications' THEN
        IF TG_OP = 'INSERT' THEN v_event_type := 'application.created';
        ELSIF TG_OP = 'UPDATE' THEN v_event_type := 'application.updated';
        END IF;
    END IF;

    IF v_event_type IS NULL THEN RETURN NULL; END IF;

    -- Prepare Payload (Filtered for security)
    IF TG_TABLE_NAME = 'employees' THEN
        v_payload := jsonb_build_object(
            'event', v_event_type,
            'timestamp', NOW(),
            'data', jsonb_build_object(
                'id', NEW.id,
                'first_name', NEW.first_name,
                'last_name', NEW.last_name,
                'email', NEW.email,
                'position', NEW.position,
                'department', NEW.department,
                'status', NEW.status,
                'tenant_id', NEW.tenant_id
            )
        );
    ELSIF TG_TABLE_NAME = 'applications' THEN
        v_payload := jsonb_build_object(
            'event', v_event_type,
            'timestamp', NOW(),
            'data', jsonb_build_object(
                'id', NEW.id,
                'job_posting_id', NEW.job_posting_id,
                'status', NEW.status,
                'pipeline_stage', NEW.pipeline_stage,
                'score', NEW.score,
                'tenant_id', NEW.tenant_id
            )
        );
    ELSE
        v_payload := jsonb_build_object(
            'event', v_event_type,
            'timestamp', NOW(),
            'data', row_to_json(NEW)
        );
    END IF;

    -- Find matching webhooks
    FOR v_webhook IN 
        SELECT id, url, tenant_id FROM webhooks 
        WHERE tenant_id = NEW.tenant_id 
        AND is_active = true 
        AND v_event_type = ANY(events)
    LOOP
        -- Insert into delivery queue (Edge Function will pick this up or PG_NET can send it)
        -- For simplicity in this stack, we stick to inserting a record. A cron or edge function would poll this.
        -- OR, we could use net.http_post here if the extension is enabled.
        -- We will assume an Edge Function 'process-webhooks' will poll 'pending' deliveries.
        
        INSERT INTO webhook_deliveries (
            webhook_id,
            tenant_id,
            event_type,
            payload,
            status
        ) VALUES (
            v_webhook.id,
            v_webhook.tenant_id,
            v_event_type,
            v_payload,
            'pending'
        );
    END LOOP;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Triggers to Key Tables
DROP TRIGGER IF EXISTS trg_webhook_employees ON employees;
CREATE TRIGGER trg_webhook_employees
AFTER INSERT OR UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION trigger_webhook_event();

DROP TRIGGER IF EXISTS trg_webhook_applications ON applications;
CREATE TRIGGER trg_webhook_applications
AFTER INSERT OR UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION trigger_webhook_event();
