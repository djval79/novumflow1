-- ============================================================================
-- CARE FLOW: CLIENTS & VISITS SCHEMA
-- ============================================================================

-- 1. CLIENTS (Service Users)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    address TEXT,
    postcode TEXT,
    care_needs TEXT, -- e.g., "Personal Care, Medication"
    risk_level TEXT DEFAULT 'low', -- low, medium, high
    key_safe_code TEXT,
    gp_details JSONB DEFAULT '{}',
    nok_details JSONB DEFAULT '{}', -- Next of Kin
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VISITS (The core unit of care)
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    carer_id UUID REFERENCES users_profiles(user_id), -- Can be NULL if unassigned
    visit_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    visit_type TEXT NOT NULL, -- e.g., "Morning Call", "Lunch", "Bedtime"
    status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, missed, cancelled
    tasks JSONB DEFAULT '[]', -- List of tasks to complete
    notes TEXT,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    check_in_location JSONB, -- GPS coords
    check_out_location JSONB,
    is_late BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Clients: Admins/Managers read/write, Carers read-only (assigned clients only - simplified to all for now)
CREATE POLICY "clients_admin_all" ON clients FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' IN ('admin', 'manager', 'super_admin'))
WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager', 'super_admin'));

CREATE POLICY "clients_carer_read" ON clients FOR SELECT TO authenticated
USING (true); -- Refine later to only assigned clients

-- Visits: Admins/Managers all, Carers see their own
CREATE POLICY "visits_admin_all" ON visits FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' IN ('admin', 'manager', 'super_admin'))
WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager', 'super_admin'));

CREATE POLICY "visits_carer_own" ON visits FOR ALL TO authenticated
USING (carer_id = auth.uid())
WITH CHECK (carer_id = auth.uid());

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO clients (first_name, last_name, address, care_needs, risk_level)
VALUES 
    ('Edith', 'Cavel', '12 Rose Garden', 'Medication, Hoist', 'high'),
    ('Arthur', 'Dent', '42 Tea Lane', 'Companionship', 'low'),
    ('Mary', 'Poppins', '17 Cherry Tree Lane', 'Personal Care', 'medium');
