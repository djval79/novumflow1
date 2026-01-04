-- Migration: Client/Care Recipient Management
-- For care organizations to track service users and care delivery

-- Clients/Service Users table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Personal Details
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    preferred_name TEXT,
    date_of_birth DATE,
    gender TEXT,
    
    -- Contact
    phone TEXT,
    email TEXT,
    
    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    postcode TEXT,
    
    -- Emergency Contact
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    
    -- Care Details
    care_level TEXT, -- 'low', 'medium', 'high', 'complex'
    funding_type TEXT, -- 'self_funded', 'local_authority', 'nhs', 'mixed'
    nhs_number TEXT,
    local_authority_id TEXT,
    
    -- GP Details
    gp_name TEXT,
    gp_practice TEXT,
    gp_phone TEXT,
    
    -- Preferences
    preferences JSONB DEFAULT '{}', -- dietary, cultural, communication preferences
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'on_hold', 'discharged', 'deceased'
    admission_date DATE,
    discharge_date DATE,
    
    -- Risk Assessments
    risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
    risk_notes TEXT,
    
    -- Photo
    photo_url TEXT,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Care Plans
CREATE TABLE IF NOT EXISTS care_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL, -- e.g., 'Personal Care Plan', 'Medication Management'
    category TEXT, -- 'personal_care', 'medication', 'mobility', 'nutrition', 'social', 'other'
    
    -- Plan details
    objectives TEXT,
    interventions TEXT,
    outcomes TEXT,
    
    -- Review
    start_date DATE,
    review_date DATE,
    last_reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'under_review', 'archived'
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Care Tasks (within a care plan)
CREATE TABLE IF NOT EXISTS care_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    care_plan_id UUID REFERENCES care_plans(id) ON DELETE SET NULL,
    
    task_name TEXT NOT NULL,
    description TEXT,
    
    -- Frequency
    frequency TEXT NOT NULL DEFAULT 'daily', -- 'once', 'daily', 'weekly', 'as_needed'
    time_of_day TEXT, -- 'morning', 'afternoon', 'evening', 'night', 'any'
    
    -- Requirements
    staff_required INTEGER DEFAULT 1,
    duration_minutes INTEGER DEFAULT 15,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Care Visits (scheduled care delivery)
CREATE TABLE IF NOT EXISTS care_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Assigned staff
    assigned_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    
    -- Timing
    scheduled_date DATE NOT NULL,
    scheduled_start TIME NOT NULL,
    scheduled_end TIME NOT NULL,
    
    -- Actual times
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'missed', 'cancelled'
    
    -- Location (for GPS tracking)
    check_in_lat DECIMAL(10, 8),
    check_in_lng DECIMAL(11, 8),
    check_out_lat DECIMAL(10, 8),
    check_out_lng DECIMAL(11, 8),
    
    -- Notes
    visit_notes TEXT,
    concerns TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visit Task Completions
CREATE TABLE IF NOT EXISTS visit_task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES care_visits(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES care_tasks(id) ON DELETE CASCADE,
    
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client Notes/Daily Logs
CREATE TABLE IF NOT EXISTS client_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES care_visits(id) ON DELETE SET NULL,
    
    note_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'care', 'medical', 'incident', 'family_contact', 'mood'
    content TEXT NOT NULL,
    
    -- Flags
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_care_plans_client ON care_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_care_tasks_client ON care_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_care_visits_client ON care_visits(client_id);
CREATE INDEX IF NOT EXISTS idx_care_visits_date ON care_visits(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_care_visits_employee ON care_visits(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_client ON client_notes(client_id);

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Tenant users can view clients"
ON clients FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage clients"
ON clients FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Care Plans policies
CREATE POLICY "Tenant users can view care plans"
ON care_plans FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage care plans"
ON care_plans FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Care Tasks policies
CREATE POLICY "Tenant users can view care tasks"
ON care_tasks FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage care tasks"
ON care_tasks FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Care Visits policies
CREATE POLICY "Tenant users can view care visits"
ON care_visits FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage care visits"
ON care_visits FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Visit Task Completions policies
CREATE POLICY "Users can view visit task completions"
ON visit_task_completions FOR SELECT
USING (
    visit_id IN (
        SELECT id FROM care_visits 
        WHERE tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can manage visit task completions"
ON visit_task_completions FOR ALL
USING (
    visit_id IN (
        SELECT id FROM care_visits 
        WHERE tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid())
    )
);

-- Client Notes policies
CREATE POLICY "Tenant users can view client notes"
ON client_notes FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage client notes"
ON client_notes FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Grants
GRANT ALL ON clients TO service_role;
GRANT ALL ON care_plans TO service_role;
GRANT ALL ON care_tasks TO service_role;
GRANT ALL ON care_visits TO service_role;
GRANT ALL ON visit_task_completions TO service_role;
GRANT ALL ON client_notes TO service_role;
