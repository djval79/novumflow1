-- Enable CareFlow for ALL tenants

-- 1. Update the careflow_enabled column (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'careflow_enabled') THEN
        UPDATE tenants SET careflow_enabled = true;
    END IF;
END $$;

-- 2. Update the settings JSONB column (fallback/redundancy)
UPDATE tenants 
SET settings = jsonb_set(
    COALESCE(settings, '{}'::jsonb), 
    '{careflow_enabled}', 
    'true'
);
