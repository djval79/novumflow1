
-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS careflow_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, warning, success, error
    read BOOLEAN DEFAULT false,
    link TEXT, -- Optional link to navigate to
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE careflow_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON careflow_notifications
    FOR SELECT USING (
        auth.uid() = recipient_id
    );

CREATE POLICY "System can create notifications" ON careflow_notifications
    FOR INSERT WITH CHECK (
        true -- Allow inserts (usually handled by triggers or backend services)
    );

CREATE POLICY "Users can update their own notifications (read status)" ON careflow_notifications
    FOR UPDATE USING (
        auth.uid() = recipient_id
    ) WITH CHECK (
        auth.uid() = recipient_id
    );
