-- Create tenant onboarding checklist table
CREATE TABLE IF NOT EXISTS tenant_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    onboarding_status TEXT DEFAULT 'not_started' CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed')),
    basic_info_completed BOOLEAN DEFAULT false,
    admin_user_created BOOLEAN DEFAULT false,
    features_configured BOOLEAN DEFAULT false,
    branding_setup BOOLEAN DEFAULT false,
    integrations_configured BOOLEAN DEFAULT false,
    first_employee_added BOOLEAN DEFAULT false,
    welcome_email_sent BOOLEAN DEFAULT false,
    completion_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- Add onboarding status to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_tenant_id ON tenant_onboarding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_status ON tenant_onboarding(onboarding_status);

-- Enable RLS
ALTER TABLE tenant_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can view all onboarding" ON tenant_onboarding
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE users_profiles.id = auth.uid()
            AND users_profiles.is_super_admin = true
        )
    );

CREATE POLICY "Super admins can manage onboarding" ON tenant_onboarding
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE users_profiles.id = auth.uid()
            AND users_profiles.is_super_admin = true
        )
    );

-- Function to auto-create onboarding record when tenant is created
CREATE OR REPLACE FUNCTION create_tenant_onboarding()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tenant_onboarding (tenant_id, started_at)
    VALUES (NEW.id, NOW())
    ON CONFLICT (tenant_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create onboarding record
DROP TRIGGER IF EXISTS trigger_create_tenant_onboarding ON tenants;
CREATE TRIGGER trigger_create_tenant_onboarding
    AFTER INSERT ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION create_tenant_onboarding();

-- Function to update completion percentage
CREATE OR REPLACE FUNCTION update_onboarding_percentage()
RETURNS TRIGGER AS $$
DECLARE
    total_steps INTEGER := 7;
    completed_steps INTEGER := 0;
    new_percentage INTEGER;
BEGIN
    -- Count completed steps
    IF NEW.basic_info_completed THEN completed_steps := completed_steps + 1; END IF;
    IF NEW.admin_user_created THEN completed_steps := completed_steps + 1; END IF;
    IF NEW.features_configured THEN completed_steps := completed_steps + 1; END IF;
    IF NEW.branding_setup THEN completed_steps := completed_steps + 1; END IF;
    IF NEW.integrations_configured THEN completed_steps := completed_steps + 1; END IF;
    IF NEW.first_employee_added THEN completed_steps := completed_steps + 1; END IF;
    IF NEW.welcome_email_sent THEN completed_steps := completed_steps + 1; END IF;
    
    -- Calculate percentage
    new_percentage := (completed_steps * 100) / total_steps;
    NEW.completion_percentage := new_percentage;
    
    -- Update status
    IF new_percentage = 0 THEN
        NEW.onboarding_status := 'not_started';
    ELSIF new_percentage = 100 THEN
        NEW.onboarding_status := 'completed';
        IF NEW.completed_at IS NULL THEN
            NEW.completed_at := NOW();
        END IF;
    ELSE
        NEW.onboarding_status := 'in_progress';
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update percentage
DROP TRIGGER IF EXISTS trigger_update_onboarding_percentage ON tenant_onboarding;
CREATE TRIGGER trigger_update_onboarding_percentage
    BEFORE INSERT OR UPDATE ON tenant_onboarding
    FOR EACH ROW
    EXECUTE FUNCTION update_onboarding_percentage();

COMMENT ON TABLE tenant_onboarding IS 'Tracks tenant onboarding progress and checklist completion';
COMMENT ON COLUMN tenant_onboarding.completion_percentage IS 'Percentage of onboarding steps completed (0-100)';
