-- Migration: Subscription & Billing Schema
-- For monetizing NovumFlow as a SaaS product

-- Subscription Plans Table (defines available tiers)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'starter', 'professional', 'enterprise'
    display_name TEXT NOT NULL, -- 'Starter', 'Professional', 'Enterprise'
    description TEXT,
    
    -- Pricing
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    currency TEXT NOT NULL DEFAULT 'GBP',
    
    -- Stripe IDs
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    stripe_product_id TEXT,
    
    -- Limits & Features
    max_employees INTEGER, -- NULL = unlimited
    max_users INTEGER, -- NULL = unlimited
    max_job_postings INTEGER, -- NULL = unlimited
    ai_screenings_per_month INTEGER, -- NULL = unlimited
    storage_gb INTEGER DEFAULT 5,
    
    -- Feature Flags (which features are included)
    features JSONB NOT NULL DEFAULT '{}', 
    -- Example: {"recruitment": true, "ai_screening": true, "sponsor_guardian": false, "api_access": false}
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant Subscriptions Table
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trialing', 'past_due', 'cancelled', 'paused'
    
    -- Billing Period
    billing_interval TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    
    -- Trial
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    
    -- Stripe
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    
    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Usage Tracking (for metered billing)
    ai_screenings_used INTEGER DEFAULT 0,
    ai_screenings_reset_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id) -- One active subscription per tenant
);

-- Payment History Table
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES tenant_subscriptions(id),
    
    -- Payment Details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    status TEXT NOT NULL, -- 'succeeded', 'failed', 'pending', 'refunded'
    
    -- Stripe
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    stripe_charge_id TEXT,
    
    -- Invoice
    invoice_number TEXT,
    invoice_url TEXT,
    receipt_url TEXT,
    
    -- Description
    description TEXT,
    
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usage Logs (for tracking feature usage)
CREATE TABLE IF NOT EXISTS subscription_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    usage_type TEXT NOT NULL, -- 'ai_screening', 'document_upload', 'email_sent', etc.
    quantity INTEGER NOT NULL DEFAULT 1,
    
    -- Context
    entity_type TEXT, -- 'application', 'employee', etc.
    entity_id UUID,
    
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_tenant ON payment_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_tenant ON subscription_usage_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_type ON subscription_usage_logs(usage_type);

-- RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage_logs ENABLE ROW LEVEL SECURITY;

-- Plans are readable by all authenticated users
CREATE POLICY "Anyone can view subscription plans"
ON subscription_plans FOR SELECT
USING (is_active = TRUE);

-- Subscriptions are tenant-scoped
CREATE POLICY "Tenant users can view their subscription"
ON tenant_subscriptions FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Payment history is tenant-scoped
CREATE POLICY "Tenant users can view payment history"
ON payment_history FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Usage logs are tenant-scoped
CREATE POLICY "Tenant users can view usage logs"
ON subscription_usage_logs FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Insert default plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, max_employees, max_users, max_job_postings, ai_screenings_per_month, storage_gb, features, sort_order)
VALUES
    ('starter', 'Starter', 'Perfect for small teams getting started', 29.00, 290.00, 25, 3, 5, 50, 5, 
     '{"dashboard": true, "hr_module": true, "recruitment": true, "documents": true, "messaging": false, "ai_screening": true, "sponsor_guardian": false, "automation": false, "api_access": false}', 1),
    
    ('professional', 'Professional', 'For growing organizations with advanced needs', 79.00, 790.00, 100, 10, 25, 500, 25, 
     '{"dashboard": true, "hr_module": true, "recruitment": true, "documents": true, "messaging": true, "ai_screening": true, "sponsor_guardian": true, "automation": true, "api_access": false, "priority_support": true}', 2),
    
    ('enterprise', 'Enterprise', 'Unlimited power for large organizations', 199.00, 1990.00, NULL, NULL, NULL, NULL, 100, 
     '{"dashboard": true, "hr_module": true, "recruitment": true, "documents": true, "messaging": true, "ai_screening": true, "sponsor_guardian": true, "automation": true, "api_access": true, "priority_support": true, "dedicated_account_manager": true, "custom_branding": true, "sso": true}', 3)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions
GRANT SELECT ON subscription_plans TO authenticated;
GRANT ALL ON tenant_subscriptions TO service_role;
GRANT ALL ON payment_history TO service_role;
GRANT ALL ON subscription_usage_logs TO service_role;

-- Function to check if a tenant has access to a feature based on their subscription
CREATE OR REPLACE FUNCTION check_subscription_feature(p_tenant_id UUID, p_feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_features JSONB;
    v_status TEXT;
BEGIN
    -- Get the tenant's active subscription features
    SELECT sp.features, ts.status
    INTO v_features, v_status
    FROM tenant_subscriptions ts
    JOIN subscription_plans sp ON ts.plan_id = sp.id
    WHERE ts.tenant_id = p_tenant_id
    AND ts.status IN ('active', 'trialing');
    
    -- If no subscription found, deny access
    IF v_features IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if the feature is enabled in the plan
    RETURN COALESCE((v_features->>p_feature)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and increment usage
CREATE OR REPLACE FUNCTION increment_usage(p_tenant_id UUID, p_usage_type TEXT, p_quantity INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
    v_subscription RECORD;
    v_plan RECORD;
    v_current_usage INTEGER;
    v_limit INTEGER;
BEGIN
    -- Get subscription
    SELECT * INTO v_subscription
    FROM tenant_subscriptions
    WHERE tenant_id = p_tenant_id AND status IN ('active', 'trialing');
    
    IF v_subscription IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get plan limits
    SELECT * INTO v_plan
    FROM subscription_plans WHERE id = v_subscription.plan_id;
    
    -- Check based on usage type
    IF p_usage_type = 'ai_screening' THEN
        v_limit := v_plan.ai_screenings_per_month;
        v_current_usage := v_subscription.ai_screenings_used;
        
        -- Unlimited
        IF v_limit IS NULL THEN
            UPDATE tenant_subscriptions SET ai_screenings_used = ai_screenings_used + p_quantity WHERE id = v_subscription.id;
            RETURN TRUE;
        END IF;
        
        -- Check limit
        IF v_current_usage + p_quantity > v_limit THEN
            RETURN FALSE;
        END IF;
        
        UPDATE tenant_subscriptions SET ai_screenings_used = ai_screenings_used + p_quantity WHERE id = v_subscription.id;
    END IF;
    
    -- Log usage
    INSERT INTO subscription_usage_logs (tenant_id, usage_type, quantity)
    VALUES (p_tenant_id, p_usage_type, p_quantity);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
