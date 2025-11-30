-- ============================================
-- Phase 2: CareFlow Database Schema (BULLETPROOF VERSION)
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
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns to clients if they don't exist
DO $$
BEGIN
    -- Personal Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'date_of_birth') THEN
        ALTER TABLE clients ADD COLUMN date_of_birth DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'gender') THEN
        ALTER TABLE clients ADD COLUMN gender TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'address') THEN
        ALTER TABLE clients ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'postcode') THEN
        ALTER TABLE clients ADD COLUMN postcode TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'phone') THEN
        ALTER TABLE clients ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'email') THEN
        ALTER TABLE clients ADD COLUMN email TEXT;
    END IF;

    -- Care Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'care_level') THEN
        ALTER TABLE clients ADD COLUMN care_level TEXT CHECK (care_level IN ('Low', 'Medium', 'High', 'Critical'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status') THEN
        ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Hospitalized', 'Deceased', 'Archived'));
    END IF;

    -- Medical
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'nhs_number') THEN
        ALTER TABLE clients ADD COLUMN nhs_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'gp_name') THEN
        ALTER TABLE clients ADD COLUMN gp_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'gp_surgery') THEN
        ALTER TABLE clients ADD COLUMN gp_surgery TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'allergies') THEN
        ALTER TABLE clients ADD COLUMN allergies TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'dietary_requirements') THEN
        ALTER TABLE clients ADD COLUMN dietary_requirements TEXT[];
    END IF;

    -- Emergency Contact
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'emergency_contact_name') THEN
        ALTER TABLE clients ADD COLUMN emergency_contact_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'emergency_contact_relation') THEN
        ALTER TABLE clients ADD COLUMN emergency_contact_relation TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'emergency_contact_phone') THEN
        ALTER TABLE clients ADD COLUMN emergency_contact_phone TEXT;
    END IF;

    -- Funding
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'funding_source') THEN
        ALTER TABLE clients ADD COLUMN funding_source TEXT CHECK (funding_source IN ('Private', 'Council', 'NHS', 'Mixed'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'funding_details') THEN
        ALTER TABLE clients ADD COLUMN funding_details JSONB DEFAULT '{}';
    END IF;
END $$;

-- Indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
-- Only create status index if column exists (it should now)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
    END IF;
END $$;


-- Care Plans Table
CREATE TABLE IF NOT EXISTS care_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns to care_plans
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_plans' AND column_name = 'summary') THEN
        ALTER TABLE care_plans ADD COLUMN summary TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_plans' AND column_name = 'review_date') THEN
        ALTER TABLE care_plans ADD COLUMN review_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_plans' AND column_name = 'needs') THEN
        ALTER TABLE care_plans ADD COLUMN needs JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_plans' AND column_name = 'risks') THEN
        ALTER TABLE care_plans ADD COLUMN risks JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_plans' AND column_name = 'goals') THEN
        ALTER TABLE care_plans ADD COLUMN goals JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_plans' AND column_name = 'status') THEN
        ALTER TABLE care_plans ADD COLUMN status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Draft', 'Archived'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_plans' AND column_name = 'created_by') THEN
        ALTER TABLE care_plans ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_care_plans_tenant ON care_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_client ON care_plans(client_id);


-- ============================================
-- 2. Scheduling & Visits
-- ============================================

-- Visits Table
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    visit_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns to visits
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'date') THEN
        ALTER TABLE visits ADD COLUMN date DATE DEFAULT CURRENT_DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'staff_id') THEN
        ALTER TABLE visits ADD COLUMN staff_id UUID REFERENCES employees(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'duration_minutes') THEN
        ALTER TABLE visits ADD COLUMN duration_minutes INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'status') THEN
        ALTER TABLE visits ADD COLUMN status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Missed', 'Cancelled'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'check_in_time') THEN
        ALTER TABLE visits ADD COLUMN check_in_time TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'check_out_time') THEN
        ALTER TABLE visits ADD COLUMN check_out_time TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'check_in_location') THEN
        ALTER TABLE visits ADD COLUMN check_in_location JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'check_out_location') THEN
        ALTER TABLE visits ADD COLUMN check_out_location JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'notes') THEN
        ALTER TABLE visits ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'tasks_completed') THEN
        ALTER TABLE visits ADD COLUMN tasks_completed JSONB DEFAULT '[]';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_visits_tenant ON visits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visits_client ON visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_staff ON visits(staff_id);
-- Only create date index if column exists (it should now)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'date') THEN
        CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date);
    END IF;
END $$;


-- ============================================
-- 3. Medication (eMAR)
-- ============================================

-- Medications Table
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    start_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns to medications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'route') THEN
        ALTER TABLE medications ADD COLUMN route TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'end_date') THEN
        ALTER TABLE medications ADD COLUMN end_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'instructions') THEN
        ALTER TABLE medications ADD COLUMN instructions TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'stock_level') THEN
        ALTER TABLE medications ADD COLUMN stock_level INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'low_stock_threshold') THEN
        ALTER TABLE medications ADD COLUMN low_stock_threshold INTEGER DEFAULT 5;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medications' AND column_name = 'is_active') THEN
        ALTER TABLE medications ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_medications_tenant ON medications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_medications_client ON medications(client_id);


-- Medication Records (MAR)
CREATE TABLE IF NOT EXISTS medication_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Taken', 'Missed', 'Refused', 'Not Required')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns to medication_records
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_records' AND column_name = 'visit_id') THEN
        ALTER TABLE medication_records ADD COLUMN visit_id UUID REFERENCES visits(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_records' AND column_name = 'scheduled_time') THEN
        ALTER TABLE medication_records ADD COLUMN scheduled_time TIME;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_records' AND column_name = 'time_slot') THEN
        ALTER TABLE medication_records ADD COLUMN time_slot TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_records' AND column_name = 'administered_by') THEN
        ALTER TABLE medication_records ADD COLUMN administered_by UUID REFERENCES employees(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_records' AND column_name = 'administered_at') THEN
        ALTER TABLE medication_records ADD COLUMN administered_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medication_records' AND column_name = 'notes') THEN
        ALTER TABLE medication_records ADD COLUMN notes TEXT;
    END IF;
END $$;

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
    date TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns to incidents
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'date') THEN
        ALTER TABLE incidents ADD COLUMN date TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'client_id') THEN
        ALTER TABLE incidents ADD COLUMN client_id UUID REFERENCES clients(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'staff_id') THEN
        ALTER TABLE incidents ADD COLUMN staff_id UUID REFERENCES employees(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'severity') THEN
        ALTER TABLE incidents ADD COLUMN severity TEXT CHECK (severity IN ('Low', 'Medium', 'High', 'Critical'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'action_taken') THEN
        ALTER TABLE incidents ADD COLUMN action_taken TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'status') THEN
        ALTER TABLE incidents ADD COLUMN status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Investigating', 'Resolved', 'Closed'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'reported_by') THEN
        ALTER TABLE incidents ADD COLUMN reported_by UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'is_riddor_reportable') THEN
        ALTER TABLE incidents ADD COLUMN is_riddor_reportable BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'cqc_notified') THEN
        ALTER TABLE incidents ADD COLUMN cqc_notified BOOLEAN DEFAULT false;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_incidents_tenant ON incidents(tenant_id);


-- Care Notes
CREATE TABLE IF NOT EXISTS care_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns to care_notes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_notes' AND column_name = 'visit_id') THEN
        ALTER TABLE care_notes ADD COLUMN visit_id UUID REFERENCES visits(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_notes' AND column_name = 'created_by') THEN
        ALTER TABLE care_notes ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_notes' AND column_name = 'mood') THEN
        ALTER TABLE care_notes ADD COLUMN mood TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_care_notes_tenant ON care_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_care_notes_client ON care_notes(client_id);


-- ============================================
-- 5. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid errors
DROP POLICY IF EXISTS "Users can access clients in their tenant" ON clients;
DROP POLICY IF EXISTS "Users can access care plans in their tenant" ON care_plans;
DROP POLICY IF EXISTS "Users can access visits in their tenant" ON visits;
DROP POLICY IF EXISTS "Users can access medications in their tenant" ON medications;
DROP POLICY IF EXISTS "Users can access mar records in their tenant" ON medication_records;
DROP POLICY IF EXISTS "Users can access incidents in their tenant" ON incidents;
DROP POLICY IF EXISTS "Users can access care notes in their tenant" ON care_notes;

-- Re-create Policies
CREATE POLICY "Users can access clients in their tenant" ON clients FOR ALL USING (user_has_tenant_access(tenant_id));
CREATE POLICY "Users can access care plans in their tenant" ON care_plans FOR ALL USING (user_has_tenant_access(tenant_id));
CREATE POLICY "Users can access visits in their tenant" ON visits FOR ALL USING (user_has_tenant_access(tenant_id));
CREATE POLICY "Users can access medications in their tenant" ON medications FOR ALL USING (user_has_tenant_access(tenant_id));
CREATE POLICY "Users can access mar records in their tenant" ON medication_records FOR ALL USING (user_has_tenant_access(tenant_id));
CREATE POLICY "Users can access incidents in their tenant" ON incidents FOR ALL USING (user_has_tenant_access(tenant_id));
CREATE POLICY "Users can access care notes in their tenant" ON care_notes FOR ALL USING (user_has_tenant_access(tenant_id));


-- ============================================
-- 6. Triggers for Updated At
-- ============================================

-- Drop existing triggers to avoid errors
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_care_plans_updated_at ON care_plans;
DROP TRIGGER IF EXISTS update_visits_updated_at ON visits;
DROP TRIGGER IF EXISTS update_medications_updated_at ON medications;
DROP TRIGGER IF EXISTS update_medication_records_updated_at ON medication_records;
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;

-- Re-create triggers
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
            -- We must ensure columns exist before inserting, but since we just added them above, it should be safe.
            -- However, to be extra safe against race conditions or partial failures, we can check again or just run it.
            
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
