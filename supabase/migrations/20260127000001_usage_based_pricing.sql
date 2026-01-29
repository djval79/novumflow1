-- Add usage-based pricing and overage billing

-- Create usage-based pricing tiers
CREATE TABLE IF NOT EXISTS usage_pricing_tiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    app_name text NOT NULL,
    metric_type text NOT NULL, -- 'ai_screenings', 'api_calls', 'storage_gb', etc.
    tier_name text NOT NULL, -- 'basic', 'professional', 'enterprise'
    min_units integer NOT NULL DEFAULT 0,
    max_units integer, -- NULL for unlimited
    unit_price decimal(10,4) NOT NULL, -- Price per unit
    overage_price decimal(10,4) NOT NULL DEFAULT 0.10, -- Price for usage beyond limit
    currency text NOT NULL DEFAULT 'GBP',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Usage tracking with real-time updates
CREATE TABLE IF NOT EXISTS real_time_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    app_name text NOT NULL,
    metric_type text NOT NULL,
    current_usage integer NOT NULL DEFAULT 0,
    period_start date NOT NULL,
    period_end date NOT NULL,
    last_updated timestamptz DEFAULT now(),
    UNIQUE(tenant_id, app_name, metric_type, period_start)
);

-- Overage billing records
CREATE TABLE IF NOT EXISTS overage_charges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    billing_period date NOT NULL,
    metric_type text NOT NULL,
    included_units integer NOT NULL DEFAULT 0,
    actual_usage integer NOT NULL DEFAULT 0,
    overage_units integer NOT NULL DEFAULT 0,
    unit_price decimal(10,4) NOT NULL,
    overage_price decimal(10,4) NOT NULL,
    total_charge decimal(10,2) NOT NULL,
    currency text NOT NULL DEFAULT 'GBP',
    created_at timestamptz DEFAULT now()
);

-- Insert usage pricing tiers
INSERT INTO usage_pricing_tiers (app_name, metric_type, tier_name, min_units, max_units, unit_price, overage_price) VALUES
-- NovumFlow HR usage pricing
('novumflow', 'ai_screenings', 'starter', 0, 10, 0.00, 0.50),
('novumflow', 'ai_screenings', 'professional', 0, 100, 0.00, 0.20),
('novumflow', 'ai_screenings', 'enterprise', 0, NULL, 0.00, 0.10),
('novumflow', 'storage_gb', 'starter', 0, 5, 0.00, 0.50),
('novumflow', 'storage_gb', 'professional', 0, 25, 0.00, 0.20),
('novumflow', 'storage_gb', 'enterprise', 0, 500, 0.00, 0.10),

-- CareFlow usage pricing  
('careflow', 'ai_care_plans', 'starter', 0, 10, 0.00, 1.00),
('careflow', 'ai_care_plans', 'professional', 0, 100, 0.00, 0.50),
('careflow', 'ai_care_plans', 'enterprise', 0, NULL, 0.00, 0.25),
('careflow', 'storage_gb', 'starter', 0, 10, 0.00, 0.50),
('careflow', 'storage_gb', 'professional', 0, 50, 0.00, 0.20),
('careflow', 'storage_gb', 'enterprise', 0, 500, 0.00, 0.10),

-- ComplyFlow usage pricing
('complyflow', 'ai_analyses', 'starter', 0, 10, 0.00, 2.00),
('complyflow', 'ai_analyses', 'professional', 0, 100, 0.00, 1.00),
('complyflow', 'ai_analyses', 'enterprise', 0, NULL, 0.00, 0.50);

-- Function to track usage in real-time
CREATE OR REPLACE FUNCTION track_real_time_usage(
    p_tenant_id uuid,
    p_app_name text,
    p_metric_type text,
    p_usage_increment integer DEFAULT 1
) RETURNS void AS $$
DECLARE
    v_period_start date;
    v_period_end date;
BEGIN
    -- Calculate current billing period (monthly)
    v_period_start := date_trunc('month', CURRENT_DATE);
    v_period_end := v_period_start + interval '1 month' - interval '1 day';
    
    -- Insert or update usage
    INSERT INTO real_time_usage (
        tenant_id, app_name, metric_type, current_usage, 
        period_start, period_end, last_updated
    ) VALUES (
        p_tenant_id, p_app_name, p_metric_type, p_usage_increment,
        v_period_start, v_period_end, now()
    )
    ON CONFLICT (tenant_id, app_name, metric_type, period_start)
    DO UPDATE SET
        current_usage = real_time_usage.current_usage + p_usage_increment,
        last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate overage charges
CREATE OR REPLACE FUNCTION calculate_overage_charges(
    p_tenant_id uuid,
    p_billing_period date DEFAULT NULL
) RETURNS TABLE (
    metric_type text,
    included_units integer,
    actual_usage integer,
    overage_units integer,
    overage_charge decimal(10,2)
) AS $$
DECLARE
    v_period date;
    v_plan record;
BEGIN
    v_period := COALESCE(p_billing_period, date_trunc('month', CURRENT_DATE));
    
    -- Get tenant's plan for each app
    FOR v_plan IN 
        SELECT DISTINCT ON (sp.app_name) 
            sp.app_name,
            sp.plan_id,
            sp.ai_screenings_per_month,
            sp.ai_care_plans_per_month,
            sp.ai_analyses_per_month,
            sp.storage_gb
        FROM tenant_subscriptions ts
        JOIN subscription_plans sp ON ts.plan_id = sp.plan_id
        WHERE ts.tenant_id = p_tenant_id 
        AND ts.status = 'active'
    LOOP
        -- Calculate overage for each metric type
        IF v_plan.app_name = 'novumflow' THEN
            RETURN QUERY SELECT 
                'ai_screenings'::text,
                COALESCE(v_plan.ai_screenings_per_month, 0),
                COALESCE(rt.current_usage, 0),
                GREATEST(0, COALESCE(rt.current_usage, 0) - COALESCE(v_plan.ai_screenings_per_month, 0)),
                GREATEST(0, COALESCE(rt.current_usage, 0) - COALESCE(v_plan.ai_screenings_per_month, 0)) * 
                    COALESCE(up.overage_price, 0.50)
            FROM real_time_usage rt
            LEFT JOIN usage_pricing_tiers up ON up.app_name = 'novumflow' 
                AND up.metric_type = 'ai_screenings' 
                AND up.tier_name = v_plan.plan_id
            LEFT JOIN usage_pricing_tiers upt ON upt.app_name = 'novumflow'
                AND upt.metric_type = 'ai_screenings'
                AND upt.tier_name = 'professional'
            WHERE rt.tenant_id = p_tenant_id 
            AND rt.app_name = 'novumflow'
            AND rt.metric_type = 'ai_screenings'
            AND rt.period_start = date_trunc('month', v_period);
            
        ELSIF v_plan.app_name = 'careflow' THEN
            RETURN QUERY SELECT 
                'ai_care_plans'::text,
                COALESCE(v_plan.ai_care_plans_per_month, 0),
                COALESCE(rt.current_usage, 0),
                GREATEST(0, COALESCE(rt.current_usage, 0) - COALESCE(v_plan.ai_care_plans_per_month, 0)),
                GREATEST(0, COALESCE(rt.current_usage, 0) - COALESCE(v_plan.ai_care_plans_per_month, 0)) * 
                    COALESCE(up.overage_price, 0.50)
            FROM real_time_usage rt
            LEFT JOIN usage_pricing_tiers up ON up.app_name = 'careflow' 
                AND up.metric_type = 'ai_care_plans' 
                AND up.tier_name = v_plan.plan_id
            WHERE rt.tenant_id = p_tenant_id 
            AND rt.app_name = 'careflow'
            AND rt.metric_type = 'ai_care_plans'
            AND rt.period_start = date_trunc('month', v_period);
            
        ELSIF v_plan.app_name = 'complyflow' THEN
            RETURN QUERY SELECT 
                'ai_analyses'::text,
                COALESCE(v_plan.ai_analyses_per_month, 0),
                COALESCE(rt.current_usage, 0),
                GREATEST(0, COALESCE(rt.current_usage, 0) - COALESCE(v_plan.ai_analyses_per_month, 0)),
                GREATEST(0, COALESCE(rt.current_usage, 0) - COALESCE(v_plan.ai_analyses_per_month, 0)) * 
                    COALESCE(up.overage_price, 1.00)
            FROM real_time_usage rt
            LEFT JOIN usage_pricing_tiers up ON up.app_name = 'complyflow' 
                AND up.metric_type = 'ai_analyses' 
                AND up.tier_name = v_plan.plan_id
            WHERE rt.tenant_id = p_tenant_id 
            AND rt.app_name = 'complyflow'
            AND rt.metric_type = 'ai_analyses'
            AND rt.period_start = date_trunc('month', v_period);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate monthly overage bills
CREATE OR REPLACE FUNCTION generate_monthly_overage_bills()
RETURNS void AS $$
DECLARE
    v_tenant record;
    v_overage record;
BEGIN
    -- Process each active tenant
    FOR v_tenant IN 
        SELECT DISTINCT tenant_id 
        FROM tenant_subscriptions 
        WHERE status = 'active'
    LOOP
        -- Generate overage charges for each metric
        FOR v_overage IN 
            SELECT * FROM calculate_overage_charges(v_tenant.tenant_id)
        LOOP
            -- Insert overage charge record
            INSERT INTO overage_charges (
                tenant_id, billing_period, metric_type, included_units, 
                actual_usage, overage_units, unit_price, overage_price, total_charge
            ) VALUES (
                v_tenant.tenant_id,
                date_trunc('month', CURRENT_DATE),
                v_overage.metric_type,
                v_overage.included_units,
                v_overage.actual_usage,
                v_overage.overage_units,
                0, -- Base price already covered in subscription
                v_overage.overage_charge / NULLIF(v_overage.overage_units, 0),
                v_overage.overage_charge
            )
            ON CONFLICT (tenant_id, billing_period, metric_type) 
            DO UPDATE SET
                actual_usage = v_overage.actual_usage,
                overage_units = v_overage.overage_units,
                total_charge = v_overage.overage_charge;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX idx_real_time_usage_lookup ON real_time_usage(tenant_id, app_name, metric_type, period_start);
CREATE INDEX idx_overage_charges_period ON overage_charges(tenant_id, billing_period);
CREATE INDEX idx_usage_pricing_lookup ON usage_pricing_tiers(app_name, metric_type, tier_name);

-- RLS policies
ALTER TABLE usage_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE overage_charges ENABLE ROW LEVEL SECURITY;

-- Public read access for pricing
CREATE POLICY "Public read access for usage pricing" ON usage_pricing_tiers
    FOR SELECT USING (is_active = true);

-- Tenants can read their own usage
CREATE POLICY "Tenants can read own usage" ON real_time_usage
    FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY "Tenants can read own overages" ON overage_charges
    FOR SELECT USING (tenant_id = auth.tenant_id());

-- Service role full access
CREATE POLICY "Service role full access usage pricing" ON usage_pricing_tiers
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access usage tracking" ON real_time_usage
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access overage charges" ON overage_charges
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger to reset usage monthly
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS trigger AS $$
BEGIN
    -- Reset usage at the start of each month
    NEW.current_usage := 0;
    NEW.last_updated := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This would be called by a scheduled job
-- You can implement this as a cron job or Supabase Edge Function
CREATE OR REPLACE FUNCTION schedule_monthly_reset()
RETURNS void AS $$
BEGIN
    -- Reset all usage for new billing period
    UPDATE real_time_usage 
    SET current_usage = 0, last_updated = now()
    WHERE period_start = date_trunc('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;