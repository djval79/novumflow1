-- =====================================================
-- COMBINED MIGRATION SCRIPT
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- ============================================
-- PART 1: ADD TENANT_ID TO ATTENDANCE/LEAVE
-- ============================================

-- Add tenant_id column to attendance_records if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE attendance_records 
        ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_attendance_records_tenant_id 
        ON attendance_records(tenant_id);
        
        CREATE INDEX IF NOT EXISTS idx_attendance_records_tenant_date 
        ON attendance_records(tenant_id, date);
    END IF;
END $$;

-- Add tenant_id column to leave_requests if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE leave_requests 
        ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_id 
        ON leave_requests(tenant_id);
        
        CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_status 
        ON leave_requests(tenant_id, status);
    END IF;
END $$;

-- Backfill tenant_id from employees table
UPDATE attendance_records ar
SET tenant_id = e.tenant_id
FROM employees e
WHERE ar.employee_id = e.id 
  AND ar.tenant_id IS NULL;

UPDATE leave_requests lr
SET tenant_id = e.tenant_id
FROM employees e
WHERE lr.employee_id = e.id 
  AND lr.tenant_id IS NULL;

-- Enable RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy for attendance_records
DROP POLICY IF EXISTS attendance_tenant_isolation ON attendance_records;
CREATE POLICY attendance_tenant_isolation ON attendance_records
    FOR ALL
    USING (
        tenant_id = (
            SELECT up.tenant_id FROM public.users_profiles up
            WHERE up.user_id = auth.uid()
            LIMIT 1
        )
    );

-- RLS Policy for leave_requests
DROP POLICY IF EXISTS leave_tenant_isolation ON leave_requests;
CREATE POLICY leave_tenant_isolation ON leave_requests
    FOR ALL
    USING (
        tenant_id = (
            SELECT up.tenant_id FROM public.users_profiles up
            WHERE up.user_id = auth.uid()
            LIMIT 1
        )
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leave_requests TO authenticated;

-- ============================================
-- PART 2: SECURITY AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_logs_tenant 
ON security_audit_logs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_security_logs_severity 
ON security_audit_logs(severity);

CREATE INDEX IF NOT EXISTS idx_security_logs_created 
ON security_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_logs_event_type 
ON security_audit_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_security_logs_tenant_severity_created 
ON security_audit_logs(tenant_id, severity, created_at DESC);

ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS security_logs_tenant_isolation ON security_audit_logs;
CREATE POLICY security_logs_tenant_isolation ON security_audit_logs
    FOR SELECT
    USING (
        tenant_id = (
            SELECT up.tenant_id FROM public.users_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role IN ('admin', 'owner')
            LIMIT 1
        )
    );

DROP POLICY IF EXISTS security_logs_insert ON security_audit_logs;
CREATE POLICY security_logs_insert ON security_audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT ON security_audit_logs TO authenticated;

-- ============================================
-- DONE! Both migrations applied.
-- ============================================

-- ============================================
-- PART 3: FIX SUBSCRIPTION TABLES (Run this if you see 400 Bad Request)
-- ============================================

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
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON public.subscription_plans;
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
DROP POLICY IF EXISTS "Users can view own tenant subscription" ON public.tenant_subscriptions;
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

-- ============================================
-- PART 4: FIX EMAIL TEMPLATES (Run this if you see 400 Bad Request for email_templates)
-- ============================================

-- Create email_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add tenant_id if it doesn't exist (in case table already existed without it)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_templates' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.email_templates 
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant_id ON public.email_templates(tenant_id);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view/edit templates for their tenant
DROP POLICY IF EXISTS "Users can view own tenant email templates" ON public.email_templates;
CREATE POLICY "Users can view own tenant email templates" ON public.email_templates
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create email templates for own tenant" ON public.email_templates;
CREATE POLICY "Users can create email templates for own tenant" ON public.email_templates
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own tenant email templates" ON public.email_templates;
CREATE POLICY "Users can update own tenant email templates" ON public.email_templates
    FOR UPDATE TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own tenant email templates" ON public.email_templates;
CREATE POLICY "Users can delete own tenant email templates" ON public.email_templates
    FOR DELETE TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profiles 
            WHERE user_id = auth.uid()
        )
    );


