
-- Integrations Bootstrap
-- This migration creates the tables required for the integrations module.

-- 1. Table: integrations
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL UNIQUE, -- 'slack', 'zoom', 'email', 'calendar', 'storage'
    display_name TEXT NOT NULL, -- User-friendly name
    is_active BOOLEAN DEFAULT true,
    is_connected BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}',
    oauth_data JSONB,
    webhook_url TEXT,
    api_quota_limit INTEGER,
    api_quota_used INTEGER DEFAULT 0,
    quota_reset_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    connection_error TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: integration_logs
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    duration_ms NUMERIC,
    triggered_by UUID REFERENCES employees(id),
    related_entity_type TEXT,
    related_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: notification_preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    event_type TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    delivery_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, channel, event_type)
);

-- 4. Table: email_templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB DEFAULT '[]',
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS (Simple for now to avoid blocking)
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all' AND tablename = 'integrations') THEN
        CREATE POLICY "authenticated_all" ON integrations FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all' AND tablename = 'integration_logs') THEN
        CREATE POLICY "authenticated_all" ON integration_logs FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all' AND tablename = 'notification_preferences') THEN
        CREATE POLICY "authenticated_all" ON notification_preferences FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all' AND tablename = 'email_templates') THEN
        CREATE POLICY "authenticated_all" ON email_templates FOR ALL TO authenticated USING (true);
    END IF;
END $$;
