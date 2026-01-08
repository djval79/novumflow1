-- Migration to add missing tables: incident_reports, performance_reviews, performance_goals
-- This ensures the CareFlow and HR Dashboard functionality works correctly.

-- 1. INCIDENT REPORTS
CREATE TABLE IF NOT EXISTS public.incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    reported_by UUID, -- Link to auth.users if available
    incident_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'open', -- open, investigating, resolved, closed
    severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    category TEXT,
    action_taken TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PERFORMANCE REVIEWS
CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    review_type_id UUID REFERENCES public.performance_review_types(id),
    review_period_start DATE,
    review_period_end DATE,
    review_due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', 
    overall_rating INTEGER,
    overall_comments TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    action_items TEXT,
    next_review_date DATE,
    is_auto_generated BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PERFORMANCE GOALS
CREATE TABLE IF NOT EXISTS public.performance_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    goal_type TEXT DEFAULT 'individual',
    category TEXT,
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'active',
    progress_percentage INTEGER DEFAULT 0,
    measurement_criteria TEXT,
    target_value TEXT,
    current_value TEXT,
    priority TEXT DEFAULT 'medium',
    linked_review_id UUID REFERENCES public.performance_reviews(id) ON DELETE SET NULL,
    parent_goal_id UUID REFERENCES public.performance_goals(id) ON DELETE SET NULL,
    is_smart BOOLEAN DEFAULT true,
    assigned_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_goals ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incident_reports' AND policyname = 'Users can view incident_reports in their tenant') THEN
        CREATE POLICY "Users can view incident_reports in their tenant" ON public.incident_reports FOR SELECT USING (tenant_id IN (SELECT id FROM tenants));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_reviews' AND policyname = 'Users can view performance_reviews in their tenant') THEN
        CREATE POLICY "Users can view performance_reviews in their tenant" ON public.performance_reviews FOR SELECT USING (tenant_id IN (SELECT id FROM tenants));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_goals' AND policyname = 'Users can view performance_goals in their tenant') THEN
        CREATE POLICY "Users can view performance_goals in their tenant" ON public.performance_goals FOR SELECT USING (tenant_id IN (SELECT id FROM tenants));
    END IF;
END $$;

-- Allow all for tenant members (Simplified)
CREATE POLICY "Tenant members can manage incident_reports" ON public.incident_reports FOR ALL USING (true);
CREATE POLICY "Tenant members can manage performance_reviews" ON public.performance_reviews FOR ALL USING (true);
CREATE POLICY "Tenant members can manage performance_goals" ON public.performance_goals FOR ALL USING (true);
