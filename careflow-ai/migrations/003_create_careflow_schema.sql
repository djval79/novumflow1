-- ============================================
-- Phase 2: CareFlow Database Schema
-- Step 1: Create Core Care Tables
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Clients & Care Plans
-- ============================================

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Personal Details
    name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    address TEXT,
    postcode TEXT,
    phone TEXT,
    email TEXT,
    
    -- Care Details
    care_level TEXT CHECK (care_level IN ('Low', 'Medium', 'High', 'Critical')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Hospitalized', 'Deceased', 'Archived')),
    
    -- Medical
    nhs_number TEXT,
    gp_name TEXT,
    gp_surgery TEXT,
    allergies TEXT[],
    dietary_requirements TEXT[],
    
    -- Emergency Contact
    emergency_contact_name TEXT,
    emergency_contact_relation TEXT,
    emergency_contact_phone TEXT,
    
    -- Funding
    funding_source TEXT CHECK (funding_source IN ('Private', 'Council', 'NHS', 'Mixed')),
    funding_details JSONB DEFAULT '{}', -- Stores contract_id, budget_limit, etc.
    
    -- System
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_care_level CHECK (care_level IN ('Low', 'Medium', 'High', 'Critical'))
);

CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Care Plans
CREATE TABLE IF NOT EXISTS care_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    summary TEXT,
    start_date DATE NOT NULL,
    review_date DATE,
    
    -- JSONB for flexible sections (Needs, Risks, Goals)
    needs JSONB DEFAULT '[]',
    risks JSONB DEFAULT '[]',
    goals JSONB DEFAULT '[]',
    
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Draft', 'Archived')),
    created_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_plans_tenant ON care_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_client ON care_plans(client_id);

-- ============================================
-- 2. Scheduling & Visits
-- ============================================

-- Visits
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES employees(id), -- Optional: unassigned visits
    
    -- Timing
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER,
    
    -- Details
    visit_type TEXT NOT NULL, -- Personal Care, Domestic, Social, etc.
    status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Missed', 'Cancelled')),
    
    -- Verification
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    check_in_location JSONB, -- {lat, lng}
    check_out_location JSONB,
    
    notes TEXT,
    tasks_completed JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_tenant ON visits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visits_client ON visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_staff ON visits(staff_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date);

-- ============================================
-- 3. Medication (eMAR)
-- ============================================

-- Medications
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL, -- Morning, Evening, OD, BD, TDS, QDS
    route TEXT, -- Oral, Topical, etc.
    
    start_date DATE NOT NULL,
    end_date DATE,
    
    instructions TEXT,
    stock_level INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medications_tenant ON medications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_medications_client ON medications(client_id);

-- Medication Records (MAR)
CREATE TABLE IF NOT EXISTS medication_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id),
    
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    time_slot TEXT, -- Morning, Lunch, Tea, Bed
    
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Taken', 'Missed', 'Refused', 'Not Required')),
    administered_by UUID REFERENCES employees(id),
    administered_at TIMESTAMPTZ,
    
    notes TEXT, -- Reason for refusal/missed
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mar_tenant ON medication_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mar_client ON medication_records(client_id);
CREATE INDEX IF NOT EXISTS idx_mar_date ON medication_records(scheduled_date);

-- ============================================
-- 4. Incidents & Logs
-- ============================================

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    staff_id UUID REFERENCES employees(id),
    
    date TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL, -- Fall, Medication Error, Injury, etc.
    severity TEXT CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    
    description TEXT NOT NULL,
    action_taken TEXT,
    
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Investigating', 'Resolved', 'Closed')),
    reported_by UUID REFERENCES auth.users(id),
    
    is_riddor_reportable BOOLEAN DEFAULT false,
    cqc_notified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_tenant ON incidents(tenant_id);

-- Care Notes / Daily Logs
CREATE TABLE IF NOT EXISTS care_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id),
    created_by UUID REFERENCES auth.users(id),
    
    category TEXT NOT NULL, -- General, Medical, Social, Mood
    content TEXT NOT NULL,
    mood TEXT, -- Happy, Sad, Agitated, etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_notes_tenant ON care_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_care_notes_client ON care_notes(client_id);

-- ============================================
-- 5. RLS Policies
-- ============================================

-- Helper function for RLS (reused from previous migration)
-- CREATE OR REPLACE FUNCTION user_has_tenant_access(p_tenant_id UUID) ...

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_notes ENABLE ROW LEVEL SECURITY;

-- Clients Policies
CREATE POLICY "Users can access clients in their tenant"
ON clients FOR ALL USING (user_has_tenant_access(tenant_id));

-- Care Plans Policies
CREATE POLICY "Users can access care plans in their tenant"
ON care_plans FOR ALL USING (user_has_tenant_access(tenant_id));

-- Visits Policies
CREATE POLICY "Users can access visits in their tenant"
ON visits FOR ALL USING (user_has_tenant_access(tenant_id));

-- Medications Policies
CREATE POLICY "Users can access medications in their tenant"
ON medications FOR ALL USING (user_has_tenant_access(tenant_id));

-- MAR Policies
CREATE POLICY "Users can access mar records in their tenant"
ON medication_records FOR ALL USING (user_has_tenant_access(tenant_id));

-- Incidents Policies
CREATE POLICY "Users can access incidents in their tenant"
ON incidents FOR ALL USING (user_has_tenant_access(tenant_id));

-- Care Notes Policies
CREATE POLICY "Users can access care notes in their tenant"
ON care_notes FOR ALL USING (user_has_tenant_access(tenant_id));

-- ============================================
-- 6. Triggers for Updated At
-- ============================================

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON care_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medication_records_updated_at BEFORE UPDATE ON medication_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Sample Data (Optional - for testing)
-- ============================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_client_id UUID;
BEGIN
    -- Get Ringstead Care tenant
    SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'ringsteadcare' LIMIT 1;
    
    IF v_tenant_id IS NOT NULL THEN
        -- Create Sample Client if none exists
        IF NOT EXISTS (SELECT 1 FROM clients WHERE tenant_id = v_tenant_id) THEN
            INSERT INTO clients (tenant_id, name, date_of_birth, care_level, status, address)
            VALUES (v_tenant_id, 'Edith Crawley', '1940-05-12', 'High', 'Active', 'Room 101, Ringstead Care')
            RETURNING id INTO v_client_id;
            
            -- Create Sample Care Plan
            INSERT INTO care_plans (tenant_id, client_id, title, start_date, summary)
            VALUES (v_tenant_id, v_client_id, 'Initial Care Plan', NOW(), 'Requires assistance with all ADLs.');
            
            -- Create Sample Medication
            INSERT INTO medications (tenant_id, client_id, name, dosage, frequency, start_date)
            VALUES (v_tenant_id, v_client_id, 'Aspirin', '75mg', 'Morning', NOW());
            
            RAISE NOTICE 'Created sample data for Ringstead Care';
        END IF;
    END IF;
END $$;
