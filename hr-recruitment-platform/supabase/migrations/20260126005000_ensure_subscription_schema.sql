-- Create subscription_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10, 2) NOT NULL,
    price_yearly NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'GBP',
    max_employees INTEGER, -- NULL means unlimited
    max_users INTEGER, -- NULL means unlimited
    max_job_postings INTEGER, -- NULL means unlimited
    ai_screenings_per_month INTEGER, -- NULL means unlimited
    storage_gb INTEGER DEFAULT 10,
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users for plans
CREATE POLICY "Allow read access to all authenticated users" ON public.subscription_plans
    FOR SELECT TO authenticated USING (true);

-- Create tenant_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
    billing_interval TEXT CHECK (billing_interval IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    ai_screenings_used INTEGER DEFAULT 0,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    UNIQUE(tenant_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON public.tenant_subscriptions(tenant_id);

-- Enable RLS on tenant_subscriptions
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant_subscriptions
-- Users can view their own tenant's subscription
CREATE POLICY "Users can view own tenant subscription" ON public.tenant_subscriptions
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Insert default plans
INSERT INTO public.subscription_plans 
(name, display_name, description, price_monthly, price_yearly, currency, max_employees, max_users, max_job_postings, ai_screenings_per_month, storage_gb, features, sort_order)
VALUES
(
    'starter',
    'Starter',
    'Essential HR tools for small growing teams',
    49.00,
    490.00,
    'GBP',
    20, -- max_employees
    3, -- max_users
    5, -- max_job_postings
    50, -- ai_screenings_per_month
    10, -- storage_gb
    '{"dashboard": true, "hr_module": true, "recruitment": true, "documents": true, "messaging": false, "ai_screening": true, "sponsor_guardian": false, "automation": false, "api_access": false, "priority_support": false}',
    1
),
(
    'professional',
    'Professional',
    'Advanced features for scaling businesses',
    99.00,
    990.00,
    'GBP',
    100, -- max_employees
    10, -- max_users
    20, -- max_job_postings
    200, -- ai_screenings_per_month
    50, -- storage_gb
    '{"dashboard": true, "hr_module": true, "recruitment": true, "documents": true, "messaging": true, "ai_screening": true, "sponsor_guardian": true, "automation": true, "api_access": false, "priority_support": true}',
    2
),
(
    'enterprise',
    'Enterprise',
    'Full power and control for large organizations',
    249.00,
    2490.00,
    'GBP',
    NULL, -- Unlimited
    NULL, -- Unlimited
    NULL, -- Unlimited
    NULL, -- Unlimited
    500, -- storage_gb
    '{"dashboard": true, "hr_module": true, "recruitment": true, "documents": true, "messaging": true, "ai_screening": true, "sponsor_guardian": true, "automation": true, "api_access": true, "priority_support": true, "dedicated_account_manager": true, "sso": true, "custom_branding": true}',
    3
)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features;
