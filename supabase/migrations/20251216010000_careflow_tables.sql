-- CareFlow Staff table (synced from NovumFlow employees)
CREATE TABLE IF NOT EXISTS careflow_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    novumflow_employee_id UUID, -- Link back to NovumFlow employee
    user_id UUID REFERENCES auth.users(id), -- If they have login access
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'Carer', -- Admin, Carer, etc.
    status TEXT NOT NULL DEFAULT 'Active', -- Active, Inactive, On Leave
    department TEXT,
    start_date DATE,
    avatar_url TEXT,
    skills TEXT[],
    availability JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, novumflow_employee_id),
    UNIQUE(tenant_id, email)
);

-- CareFlow Compliance table (synced from NovumFlow)
CREATE TABLE IF NOT EXISTS careflow_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES careflow_staff(id) ON DELETE CASCADE,
    novumflow_record_id UUID, -- Link back to NovumFlow compliance record
    type TEXT NOT NULL, -- 'DBS Check', 'Right to Work', 'Training', etc.
    name TEXT,
    status TEXT NOT NULL DEFAULT 'valid', -- valid, expired, pending
    issue_date DATE,
    expiry_date DATE,
    document_url TEXT,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, novumflow_record_id)
);

-- CareFlow Clients table
CREATE TABLE IF NOT EXISTS careflow_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date_of_birth DATE,
    address TEXT,
    postcode TEXT,
    phone TEXT,
    email TEXT,
    care_level TEXT DEFAULT 'Medium', -- Low, Medium, High, Critical
    funding_source TEXT DEFAULT 'Private', -- Private, Council, NHS
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    dietary_requirements TEXT[],
    allergies TEXT[],
    medical_conditions TEXT[],
    gp_name TEXT,
    gp_phone TEXT,
    status TEXT DEFAULT 'Active', -- Active, Inactive, Deceased
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CareFlow Visits table
CREATE TABLE IF NOT EXISTS careflow_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES careflow_staff(id),
    scheduled_date DATE NOT NULL,
    scheduled_start TIME NOT NULL,
    scheduled_end TIME NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    visit_type TEXT NOT NULL, -- Personal Care, Medication, Social, Medical
    status TEXT NOT NULL DEFAULT 'Scheduled', -- Scheduled, In Progress, Completed, Missed, Cancelled
    notes TEXT,
    tasks_completed JSONB DEFAULT '[]',
    location_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CareFlow Care Plans table
CREATE TABLE IF NOT EXISTS careflow_care_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    status TEXT NOT NULL DEFAULT 'Active', -- Draft, Active, Under Review, Archived
    start_date DATE,
    review_date DATE,
    needs JSONB DEFAULT '[]',
    risks JSONB DEFAULT '[]',
    goals JSONB DEFAULT '[]',
    created_by UUID,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE careflow_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_care_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view staff in their tenant" ON careflow_staff
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage staff" ON careflow_staff
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can view compliance in their tenant" ON careflow_compliance
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage compliance" ON careflow_compliance
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can view clients in their tenant" ON careflow_clients
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins/Carers can manage clients" ON careflow_clients
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'admin', 'manager')
        )
    );

CREATE POLICY "Users can view visits in their tenant" ON careflow_visits
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Staff can manage visits" ON careflow_visits
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can view care plans in their tenant" ON careflow_care_plans
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Carers can manage care plans" ON careflow_care_plans
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true AND role IN ('owner', 'admin', 'manager')
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_careflow_staff_tenant ON careflow_staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_careflow_staff_novumflow ON careflow_staff(novumflow_employee_id);
CREATE INDEX IF NOT EXISTS idx_careflow_compliance_staff ON careflow_compliance(staff_id);
CREATE INDEX IF NOT EXISTS idx_careflow_compliance_expiry ON careflow_compliance(expiry_date);
CREATE INDEX IF NOT EXISTS idx_careflow_clients_tenant ON careflow_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_careflow_visits_tenant_date ON careflow_visits(tenant_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_careflow_visits_staff ON careflow_visits(staff_id);
CREATE INDEX IF NOT EXISTS idx_careflow_care_plans_client ON careflow_care_plans(client_id);

-- Add careflow_enabled to tenant features
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS careflow_enabled BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS novumflow_enabled BOOLEAN DEFAULT true;
