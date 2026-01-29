-- Update pricing structure for NovumFlow Suite with bundle pricing
-- This migration adds comprehensive pricing tables for all three products

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    app_name text NOT NULL, -- 'novumflow', 'careflow', 'complyflow'
    plan_id text NOT NULL, -- 'starter', 'professional', 'enterprise'
    display_name text NOT NULL,
    description text,
    price_monthly decimal(10,2) NOT NULL DEFAULT 0,
    price_yearly decimal(10,2) NOT NULL DEFAULT 0,
    price_per_employee decimal(10,2), -- For per-employee pricing
    price_per_bed decimal(10,2), -- For per-bed pricing (CareFlow)
    currency text NOT NULL DEFAULT 'GBP',
    max_employees integer,
    max_users integer,
    max_patients integer, -- For CareFlow
    max_locations integer,
    max_job_postings integer,
    ai_screenings_per_month integer,
    ai_care_plans_per_month integer,
    ai_analyses_per_month integer,
    storage_gb integer DEFAULT 10,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    popular boolean DEFAULT false,
    savings_percent integer, -- For yearly plans
    features jsonb DEFAULT '{}', -- Feature flags
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Suite bundles table
CREATE TABLE IF NOT EXISTS suite_bundles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id text NOT NULL, -- 'business-suite', 'professional-suite', 'enterprise-suite'
    name text NOT NULL,
    description text,
    individual_price decimal(10,2) NOT NULL, -- Sum of individual app prices
    bundle_price decimal(10,2) NOT NULL, -- Discounted bundle price
    savings_percent integer NOT NULL,
    currency text NOT NULL DEFAULT 'GBP',
    apps text[] NOT NULL, -- Array of included apps
    features text[] NOT NULL, -- Key features list
    featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Update tenant subscriptions to support bundles
ALTER TABLE tenant_subscriptions 
ADD COLUMN IF NOT EXISTS subscription_type text DEFAULT 'individual' CHECK (subscription_type IN ('individual', 'bundle')),
ADD COLUMN IF NOT EXISTS bundle_id text REFERENCES suite_bundles(bundle_id),
ADD COLUMN IF NOT EXISTS usage_data jsonb DEFAULT '{}', -- Track usage for overage billing
ADD COLUMN IF NOT EXISTS volume_tier text DEFAULT 'small' CHECK (volume_tier IN ('small', 'medium', 'large', 'enterprise'));

-- Add volume pricing tiers
CREATE TABLE IF NOT EXISTS volume_tiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name text NOT NULL,
    min_employees integer NOT NULL,
    max_employees integer,
    discount_percent integer NOT NULL DEFAULT 0,
    description text,
    is_active boolean DEFAULT true
);

-- Usage tracking for billing
CREATE TABLE IF NOT EXISTS usage_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    metric_type text NOT NULL, -- 'ai_screenings', 'ai_care_plans', 'api_calls', etc.
    usage_count integer NOT NULL DEFAULT 0,
    period_start date NOT NULL,
    period_end date NOT NULL,
    overage_count integer DEFAULT 0,
    overage_charge decimal(10,2) DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Insert NovumFlow HR plans
INSERT INTO subscription_plans (app_name, plan_id, display_name, description, price_monthly, price_yearly, price_per_employee, max_employees, max_users, max_job_postings, ai_screenings_per_month, storage_gb, sort_order, popular, savings_percent, features) VALUES
('novumflow', 'starter', 'Starter', 'Perfect for small businesses getting started with modern HR.', 0, 0, 0, 10, 3, 3, 10, 5, 1, false, NULL, '{"dashboard": true, "hr_module": true, "recruitment": true, "documents": true, "messaging": true, "ai_screening": false, "sponsor_guardian": false, "automation": false, "api_access": false, "priority_support": false, "dedicated_account_manager": false, "custom_branding": false, "sso": false}'),
('novumflow', 'professional', 'Professional', 'Advanced HR features for growing companies.', 200, 2000, 8, 50, 10, 20, 100, 25, 2, true, 20, '{"dashboard": true, "hr_module": true, "recruitment": true, "documents": true, "messaging": true, "ai_screening": true, "sponsor_guardian": false, "automation": true, "api_access": false, "priority_support": true, "dedicated_account_manager": false, "custom_branding": false, "sso": false}'),
('novumflow', 'enterprise', 'Enterprise', 'Complete HR solution for large organizations.', 1500, 15000, 12, NULL, NULL, NULL, 1000, 500, 3, false, 20, '{"dashboard": true, "hr_module": true, "recruitment": true, "documents": true, "messaging": true, "ai_screening": true, "sponsor_guardian": true, "automation": true, "api_access": true, "priority_support": true, "dedicated_account_manager": true, "custom_branding": true, "sso": true}');

-- Insert CareFlow plans
INSERT INTO subscription_plans (app_name, plan_id, display_name, description, price_monthly, price_yearly, price_per_bed, max_patients, max_staff, max_locations, ai_care_plans_per_month, storage_gb, sort_order, popular, savings_percent, features) VALUES
('careflow', 'starter', 'Starter', 'Perfect for small care homes starting their digital journey.', 0, 0, 0, 25, 15, 1, 10, 10, 1, false, NULL, '{"dashboard": true, "care_planning": true, "staff_management": true, "medication_management": true, "visit_scheduling": true, "client_management": true, "ai_features": false, "route_optimization": false, "telehealth": false, "family_portal": false, "advanced_analytics": false, "api_access": false, "priority_support": false, "custom_branding": false, "offline_mode": true}'),
('careflow', 'professional', 'Professional', 'Advanced care management with AI-powered features.', 150, 1500, 3, 100, 50, 3, 100, 50, 2, true, 17, '{"dashboard": true, "care_planning": true, "staff_management": true, "medication_management": true, "visit_scheduling": true, "client_management": true, "ai_features": true, "route_optimization": true, "telehealth": false, "family_portal": false, "advanced_analytics": true, "api_access": false, "priority_support": true, "custom_branding": false, "offline_mode": true}'),
('careflow', 'enterprise', 'Enterprise', 'Complete digital care platform for large organizations.', 598, 5870, 2.5, NULL, NULL, NULL, 1000, 500, 3, false, 20, '{"dashboard": true, "care_planning": true, "staff_management": true, "medication_management": true, "visit_scheduling": true, "client_management": true, "ai_features": true, "route_optimization": true, "telehealth": true, "family_portal": true, "advanced_analytics": true, "api_access": true, "priority_support": true, "custom_branding": true, "offline_mode": true}');

-- Update ComplyFlow plans with better pricing
INSERT INTO subscription_plans (app_name, plan_id, display_name, description, price_monthly, price_yearly, max_locations, max_staff, ai_analyses_per_month, storage_gb, sort_order, popular, savings_percent, features) VALUES
('complyflow', 'starter', 'Starter', 'Perfect for small care homes or single-location agencies.', 49, 490, 1, 10, 10, 10, 1, false, 17, '{"basic_gap_analysis": true, "compliance_dashboard": true, "manual_policy_uploads": true, "community_support": true, "ai_gap_analyzer": false, "auto_draft_policies": false, "governance_dashboard": false, "sponsor_licence_system": false, "priority_support": false}'),
('complyflow', 'professional', 'Professional', 'AI-powered compliance for growing care providers.', 99, 990, 3, 50, 100, 25, 2, true, 17, '{"basic_gap_analysis": true, "compliance_dashboard": true, "manual_policy_uploads": true, "community_support": true, "ai_gap_analyzer": true, "auto_draft_policies": true, "governance_dashboard": true, "sponsor_licence_system": true, "priority_support": true}'),
('complyflow', 'enterprise', 'Enterprise', 'Full power and customization for large groups.', 249, 2490, NULL, NULL, 1000, 500, 3, false, 17, '{"basic_gap_analysis": true, "compliance_dashboard": true, "manual_policy_uploads": true, "community_support": true, "ai_gap_analyzer": true, "auto_draft_policies": true, "governance_dashboard": true, "sponsor_licence_system": true, "multi_site_dashboard": true, "api_access": true, "custom_ai_model_tuning": true, "sso": true, "dedicated_account_manager": true, "priority_support": true}');

-- Insert suite bundles
INSERT INTO suite_bundles (bundle_id, name, description, individual_price, bundle_price, savings_percent, apps, features, featured) VALUES
('business-suite', 'Business Suite', 'Complete business management platform for SMEs', 128, 89, 30, ARRAY['NovumFlow HR', 'CareFlow Basic'], ARRAY['Up to 25 patients', 'Up to 10 employees', 'Basic care management', 'Email support'], false),
('professional-suite', 'Professional Suite', 'Comprehensive solution for growing organizations', 297, 199, 33, ARRAY['NovumFlow HR Pro', 'CareFlow Pro', 'ComplyFlow Pro'], ARRAY['Up to 100 patients', 'Up to 50 employees', 'Advanced AI features', 'Priority support'], true),
('enterprise-suite', 'Enterprise Suite', 'Complete healthcare operating system', 747, 599, 20, ARRAY['NovumFlow Enterprise', 'CareFlow Enterprise', 'ComplyFlow Enterprise'], ARRAY['Unlimited patients & employees', 'White-label options', 'Custom integrations', 'Dedicated success manager'], false);

-- Insert volume tiers
INSERT INTO volume_tiers (tier_name, min_employees, max_employees, discount_percent, description) VALUES
('small', 1, 25, 0, 'Small organizations up to 25 employees'),
('medium', 26, 100, 10, 'Medium organizations with 26-100 employees'),
('large', 101, 500, 20, 'Large organizations with 101-500 employees'),
('enterprise', 501, NULL, 30, 'Enterprise organizations with 500+ employees');

-- Indexes for performance
CREATE INDEX idx_subscription_plans_app_plan ON subscription_plans(app_name, plan_id);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX idx_suite_bundles_active ON suite_bundles(is_active) WHERE is_active = true;
CREATE INDEX idx_usage_metrics_tenant_period ON usage_metrics(tenant_id, period_start, period_end);
CREATE INDEX idx_tenant_subscriptions_bundle ON tenant_subscriptions(bundle_id);

-- RLS policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE suite_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volume_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Everyone can read active pricing
CREATE POLICY "Public read access for active plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access for active bundles" ON suite_bundles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access for active tiers" ON volume_tiers
    FOR SELECT USING (is_active = true);

-- Tenants can only access their own usage metrics
CREATE POLICY "Tenants can read own usage" ON usage_metrics
    FOR SELECT USING (tenant_id = auth.tenant_id());

-- Service role can manage everything
CREATE POLICY "Service role full access" ON subscription_plans
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access" ON suite_bundles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access" ON volume_tiers
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access" ON usage_metrics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to calculate pricing based on volume and usage
CREATE OR REPLACE FUNCTION calculate_subscription_price(
    p_app_name text,
    p_plan_id text,
    p_employee_count integer DEFAULT NULL,
    p_billing_interval text DEFAULT 'monthly'
) RETURNS TABLE (
    base_price decimal(10,2),
    volume_discount decimal(10,2),
    final_price decimal(10,2),
    applied_tier text
) AS $$
DECLARE
    v_plan record;
    v_tier record;
    v_base_price decimal(10,2);
    v_volume_discount decimal(10,2) := 0;
BEGIN
    -- Get the base plan
    SELECT * INTO v_plan 
    FROM subscription_plans 
    WHERE app_name = p_app_name AND plan_id = p_plan_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan not found: %/%', p_app_name, p_plan_id;
    END IF;
    
    -- Calculate base price based on billing interval
    IF p_billing_interval = 'yearly' THEN
        v_base_price := v_plan.price_yearly;
    ELSE
        v_base_price := v_plan.price_monthly;
    END IF;
    
    -- Apply volume discounts for per-employee pricing
    IF v_plan.price_per_employee IS NOT NULL AND p_employee_count IS NOT NULL THEN
        v_base_price := v_plan.price_per_employee * p_employee_count;
        
        -- Find applicable volume tier
        SELECT * INTO v_tier 
        FROM volume_tiers 
        WHERE min_employees <= p_employee_count 
        AND (max_employees IS NULL OR max_employees >= p_employee_count)
        AND is_active = true
        ORDER BY discount_percent DESC
        LIMIT 1;
        
        IF v_tier.discount_percent > 0 THEN
            v_volume_discount := v_base_price * (v_tier.discount_percent::decimal / 100);
        END IF;
    END IF;
    
    RETURN QUERY SELECT 
        v_base_price,
        v_volume_discount,
        v_base_price - COALESCE(v_volume_discount, 0),
        COALESCE(v_tier.tier_name, 'standard');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_subscription_plans_timestamp
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_suite_bundles_timestamp
    BEFORE UPDATE ON suite_bundles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();