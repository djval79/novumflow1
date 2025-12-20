-- Seed default integrations (table already exists)
-- First ensure we have the right columns
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integrations' AND column_name = 'description') THEN
        ALTER TABLE integrations ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integrations' AND column_name = 'category') THEN
        ALTER TABLE integrations ADD COLUMN category VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integrations' AND column_name = 'icon_url') THEN
        ALTER TABLE integrations ADD COLUMN icon_url TEXT;
    END IF;
END $$;

-- Insert default integrations using existing columns
INSERT INTO integrations (service_name, display_name, is_active, is_connected) VALUES
    ('slack', 'Slack', true, false),
    ('zoom', 'Zoom', true, false),
    ('email', 'Email (SMTP)', true, false),
    ('calendar', 'Google Calendar', true, false),
    ('storage', 'Cloud Storage', true, false)
ON CONFLICT (service_name) DO NOTHING;
