
-- 1. Notifications Table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'careflow_notifications') THEN
        CREATE TABLE careflow_notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id),
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info', -- info, warning, success, error
            read BOOLEAN DEFAULT false,
            link TEXT, -- Optional link to navigate to
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Ensure user_id exists if it was recipient_id or missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_notifications' AND column_name = 'user_id') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'careflow_notifications' AND column_name = 'recipient_id') THEN
                ALTER TABLE careflow_notifications RENAME COLUMN recipient_id TO user_id;
            ELSE
                ALTER TABLE careflow_notifications ADD COLUMN user_id UUID REFERENCES auth.users(id);
            END IF;
        END IF;
    END IF;
END $$;

-- RLS
ALTER TABLE careflow_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON careflow_notifications;
CREATE POLICY "Users can view their own notifications" ON careflow_notifications
    FOR SELECT USING (
        auth.uid() = user_id
    );

DROP POLICY IF EXISTS "System can create notifications" ON careflow_notifications;
CREATE POLICY "System can create notifications" ON careflow_notifications
    FOR INSERT WITH CHECK (
        true
    );

DROP POLICY IF EXISTS "Users can update their own notifications (read status)" ON careflow_notifications;
CREATE POLICY "Users can update their own notifications (read status)" ON careflow_notifications
    FOR UPDATE USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id
    );
