-- Migration: Create missing CareFlow tables
-- These tables replace mock data in the CareFlow application
-- Generated: 2025-12-20

-- =============================================
-- TRAINING MODULES
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'mandatory', -- mandatory, optional, refresher
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
    status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed, expired
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
    category TEXT DEFAULT 'general', -- documents, training, equipment, access, general
    is_mandatory BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    due_days INTEGER DEFAULT 7, -- Days from hire date
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS careflow_onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL,
    task_id UUID REFERENCES careflow_onboarding_tasks(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed
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
    status TEXT DEFAULT 'open', -- open, claimed, confirmed, completed, cancelled
    claimed_by UUID,
    claimed_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ASSETS / EQUIPMENT
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- medical, mobility, ppe, technology, other
    serial_number TEXT,
    status TEXT DEFAULT 'available', -- available, in_use, maintenance, retired
    location TEXT,
    assigned_to UUID, -- staff_id or client_id
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    warranty_expires DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FEEDBACK / REVIEWS
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- client_review, family_feedback, staff_feedback, compliment, complaint
    source TEXT, -- client, family, staff, external
    subject_id UUID, -- Person the feedback is about
    submitted_by UUID,
    submitted_by_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT NOT NULL,
    response TEXT,
    responded_by UUID,
    responded_at TIMESTAMPTZ,
    status TEXT DEFAULT 'open', -- open, acknowledged, resolved
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOCUMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- policy, procedure, template, form, certificate, other
    file_url TEXT NOT NULL,
    file_type TEXT, -- pdf, doc, docx, xls, xlsx
    file_size INTEGER,
    version TEXT DEFAULT '1.0',
    uploaded_by UUID,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    access_roles TEXT[], -- Which roles can access
    expires_at DATE,
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
    type TEXT NOT NULL, -- activity, outing, celebration, meeting, training
    location TEXT,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    organizer_id UUID,
    max_participants INTEGER,
    participants UUID[],
    cost_per_person DECIMAL(10,2),
    notes TEXT,
    status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
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
    priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
    category TEXT, -- admin, finance, hr, compliance, other
    assigned_to UUID,
    due_date DATE,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    tags TEXT[],
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVENTORY
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- ppe, medical, cleaning, food, stationery, other
    sku TEXT,
    quantity INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'each', -- each, box, pack, pair
    min_stock_level INTEGER DEFAULT 5,
    max_stock_level INTEGER DEFAULT 100,
    location TEXT,
    supplier TEXT,
    unit_cost DECIMAL(10,2),
    last_ordered DATE,
    last_restocked DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CRM / ENQUIRIES
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    enquiry_type TEXT NOT NULL, -- new_client, family_enquiry, service_question, complaint
    source TEXT, -- website, phone, email, referral, walk_in
    contact_name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    relationship TEXT, -- self, family, professional
    client_name TEXT,
    service_required TEXT,
    message TEXT,
    urgency TEXT DEFAULT 'normal', -- normal, urgent
    status TEXT DEFAULT 'new', -- new, contacted, meeting_scheduled, assessment_done, converted, closed
    assigned_to UUID,
    follow_up_date DATE,
    notes TEXT,
    converted_to_client_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- POLICIES (Staff Portal)
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- hr, health_safety, safeguarding, infection_control, other
    document_url TEXT,
    version TEXT DEFAULT '1.0',
    effective_date DATE,
    review_date DATE,
    status TEXT DEFAULT 'active', -- draft, active, under_review, archived
    requires_acknowledgement BOOLEAN DEFAULT false,
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
-- PAYROLL RECORDS (Staff Portal)
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    gross_pay DECIMAL(10,2) NOT NULL,
    net_pay DECIMAL(10,2) NOT NULL,
    tax_deducted DECIMAL(10,2) DEFAULT 0,
    ni_deducted DECIMAL(10,2) DEFAULT 0,
    pension_deducted DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    hours_worked DECIMAL(10,2),
    overtime_hours DECIMAL(10,2) DEFAULT 0,
    holiday_pay DECIMAL(10,2) DEFAULT 0,
    bonus DECIMAL(10,2) DEFAULT 0,
    payslip_url TEXT,
    status TEXT DEFAULT 'pending', -- pending, processed, paid
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NUTRITION (Meals & Hydration)
-- =============================================
CREATE TABLE IF NOT EXISTS careflow_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
    meal_date DATE NOT NULL,
    meal_time TIME,
    description TEXT,
    portion_eaten TEXT, -- all, most, half, little, none
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
    fluid_type TEXT, -- water, tea, coffee, juice, other
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
ALTER TABLE careflow_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_office_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_policy_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_hydration ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES (Tenant-based access)
-- =============================================

-- Generic policy creator function
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'careflow_training_modules', 'careflow_training_progress',
        'careflow_onboarding_tasks', 'careflow_onboarding_progress',
        'careflow_shift_marketplace', 'careflow_assets',
        'careflow_feedback', 'careflow_documents',
        'careflow_events', 'careflow_office_tasks',
        'careflow_inventory', 'careflow_enquiries',
        'careflow_policies', 'careflow_policy_acknowledgements',
        'careflow_payroll', 'careflow_meals', 'careflow_hydration'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        -- Allow all operations for authenticated users within their tenant
        EXECUTE format('
            CREATE POLICY IF NOT EXISTS "%s_tenant_access" ON %I
            FOR ALL USING (
                tenant_id IN (
                    SELECT tenant_id FROM users_profiles WHERE user_id = auth.uid()
                )
            )', tbl || '_policy', tbl);
    END LOOP;
END $$;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_training_modules_tenant ON careflow_training_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_staff ON careflow_training_progress(staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_marketplace_date ON careflow_shift_marketplace(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_marketplace_status ON careflow_shift_marketplace(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON careflow_assets(category);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON careflow_feedback(type);
CREATE INDEX IF NOT EXISTS idx_documents_category ON careflow_documents(category);
CREATE INDEX IF NOT EXISTS idx_events_datetime ON careflow_events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON careflow_office_tasks(status);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON careflow_inventory(category);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON careflow_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_payroll_staff ON careflow_payroll(staff_id);
CREATE INDEX IF NOT EXISTS idx_meals_client_date ON careflow_meals(client_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_hydration_client_date ON careflow_hydration(client_id, log_date);

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Default training modules (to be populated per tenant)
-- Default onboarding tasks (to be populated per tenant)

COMMENT ON TABLE careflow_training_modules IS 'Training modules for staff education and certification';
COMMENT ON TABLE careflow_shift_marketplace IS 'Marketplace for available shifts that staff can claim';
COMMENT ON TABLE careflow_assets IS 'Equipment and asset management';
COMMENT ON TABLE careflow_feedback IS 'Client and family feedback/reviews';
COMMENT ON TABLE careflow_enquiries IS 'CRM for potential client enquiries';
