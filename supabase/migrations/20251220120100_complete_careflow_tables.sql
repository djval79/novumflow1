-- Combined Fix Migration: Create tables and RLS policies for CareFlow
-- This combines the table creation and RLS policy fixes
-- Generated: 2025-12-20

-- =============================================
-- TRAINING MODULES
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'mandatory',
    duration_minutes INTEGER DEFAULT 30,
    content_url TEXT,
    video_url TEXT,
    is_mandatory BOOLEAN DEFAULT false,
    certification_valid_months INTEGER DEFAULT 12,
    pass_score INTEGER DEFAULT 80,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS careflow_training_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL,
    module_id UUID REFERENCES careflow_training_modules(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'not_started',
    progress_percent INTEGER DEFAULT 0,
    score INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ONBOARDING TASKS
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_mandatory BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    due_days INTEGER DEFAULT 7,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS careflow_onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL,
    task_id UUID REFERENCES careflow_onboarding_tasks(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SHIFT MARKETPLACE
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_shift_marketplace (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    posted_by UUID NOT NULL,
    client_id UUID,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    role_required TEXT DEFAULT 'carer',
    hourly_rate DECIMAL(10,2),
    description TEXT,
    requirements TEXT[],
    status TEXT DEFAULT 'open',
    claimed_by UUID,
    claimed_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FEEDBACK / REVIEWS
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    source TEXT,
    subject_id UUID,
    submitted_by UUID,
    submitted_by_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT NOT NULL,
    response TEXT,
    responded_by UUID,
    responded_at TIMESTAMPTZ,
    status TEXT DEFAULT 'open',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ACTIVITIES / EVENTS
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    location TEXT,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    organizer_id UUID,
    max_participants INTEGER,
    participants UUID[],
    cost_per_person DECIMAL(10,2),
    notes TEXT,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- OFFICE TASKS
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_office_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    category TEXT,
    assigned_to UUID,
    due_date DATE,
    status TEXT DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    tags TEXT[],
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- POLICY ACKNOWLEDGEMENTS (if not in policies table already)
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_policy_acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES careflow_policies(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL,
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    UNIQUE(policy_id, staff_id)
);

-- =============================================
-- NUTRITION (Meals & Hydration)
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    meal_type TEXT NOT NULL,
    meal_date DATE NOT NULL,
    meal_time TIME,
    description TEXT,
    portion_eaten TEXT,
    fluid_intake_ml INTEGER,
    assisted_by UUID,
    dietary_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS careflow_hydration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    log_date DATE NOT NULL,
    log_time TIME NOT NULL,
    fluid_type TEXT,
    amount_ml INTEGER NOT NULL,
    assisted_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENABLE RLS ON ALL NEW TABLES
-- =============================================

ALTER TABLE careflow_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_shift_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_office_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_policy_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_hydration ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES (with DROP IF EXISTS to avoid conflicts)
-- =============================================

-- Training Modules  
DROP POLICY IF EXISTS "careflow_training_modules_tenant_policy" ON careflow_training_modules;
CREATE POLICY "careflow_training_modules_tenant_policy" ON careflow_training_modules
FOR ALL USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM users_profiles WHERE user_id = auth.uid()));

-- Training Progress
DROP POLICY IF EXISTS "careflow_training_progress_tenant_policy" ON careflow_training_progress;
CREATE POLICY "careflow_training_progress_tenant_policy" ON careflow_training_progress
FOR ALL USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM users_profiles WHERE user_id = auth.uid()));

-- Onboarding Tasks
DROP POLICY IF EXISTS "careflow_onboarding_tasks_tenant_policy" ON careflow_onboarding_tasks;
CREATE POLICY "careflow_onboarding_tasks_tenant_policy" ON careflow_onboarding_tasks
FOR ALL USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM users_profiles WHERE user_id = auth.uid()));

-- Onboarding Progress
DROP POLICY IF EXISTS "careflow_onboarding_progress_tenant_policy" ON careflow_onboarding_progress;
CREATE POLICY "careflow_onboarding_progress_tenant_policy" ON careflow_onboarding_progress
FOR ALL USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM users_profiles WHERE user_id = auth.uid()));

-- Shift Marketplace
DROP POLICY IF EXISTS "careflow_shift_marketplace_tenant_policy" ON careflow_shift_marketplace;
CREATE POLICY "careflow_shift_marketplace_tenant_policy" ON careflow_shift_marketplace
FOR ALL USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM users_profiles WHERE user_id = auth.uid()));

-- Feedback
DROP POLICY IF EXISTS "careflow_feedback_tenant_policy" ON careflow_feedback;
CREATE POLICY "careflow_feedback_tenant_policy" ON careflow_feedback
FOR ALL USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM users_profiles WHERE user_id = auth.uid()));

-- Events
DROP POLICY IF EXISTS "careflow_events_tenant_policy" ON careflow_events;
CREATE POLICY "careflow_events_tenant_policy" ON careflow_events
FOR ALL USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM users_profiles WHERE user_id = auth.uid()));

-- Office Tasks
DROP POLICY IF EXISTS "careflow_office_tasks_tenant_policy" ON careflow_office_tasks;
CREATE POLICY "careflow_office_tasks_tenant_policy" ON careflow_office_tasks
FOR ALL USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM users_profiles WHERE user_id = auth.uid()));

-- Policy Acknowledgements
DROP POLICY IF EXISTS "careflow_policy_acknowledgements_tenant_policy" ON careflow_policy_acknowledgements;
CREATE POLICY "careflow_policy_acknowledgements_tenant_policy" ON careflow_policy_acknowledgements
FOR ALL USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM users_profiles WHERE user_id = auth.uid()));

-- Meals
DROP POLICY IF EXISTS "careflow_meals_tenant_policy" ON careflow_meals;
CREATE POLICY "careflow_meals_tenant_policy" ON careflow_meals
FOR ALL USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM users_profiles WHERE user_id = auth.uid()));

-- Hydration
DROP POLICY IF EXISTS "careflow_hydration_tenant_policy" ON careflow_hydration;
CREATE POLICY "careflow_hydration_tenant_policy" ON careflow_hydration
FOR ALL USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM users_profiles WHERE user_id = auth.uid()));

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_training_modules_tenant ON careflow_training_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_staff ON careflow_training_progress(staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_marketplace_date ON careflow_shift_marketplace(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_marketplace_status ON careflow_shift_marketplace(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON careflow_feedback(type);
CREATE INDEX IF NOT EXISTS idx_events_datetime ON careflow_events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON careflow_office_tasks(status);
CREATE INDEX IF NOT EXISTS idx_meals_client_date ON careflow_meals(client_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_hydration_client_date ON careflow_hydration(client_id, log_date);

-- Done
