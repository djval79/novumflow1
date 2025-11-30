-- Create Medications Table
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT, -- e.g. "Morning", "Twice Daily"
    route TEXT, -- e.g. "Oral", "Topical"
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Discontinued')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Medication Logs Table
CREATE TABLE IF NOT EXISTS medication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    
    status TEXT NOT NULL CHECK (status IN ('Administered', 'Refused', 'Omitted')),
    notes TEXT,
    administered_at TIMESTAMPTZ DEFAULT NOW(),
    administered_by UUID NOT NULL REFERENCES employees(id), -- The staff member who did it
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Medications
DROP POLICY IF EXISTS "Users can access medications in their tenant" ON medications;
CREATE POLICY "Users can access medications in their tenant"
ON medications FOR ALL USING (user_has_tenant_access(tenant_id));

-- Policies for Medication Logs
DROP POLICY IF EXISTS "Users can access medication logs in their tenant" ON medication_logs;
CREATE POLICY "Users can access medication logs in their tenant"
ON medication_logs FOR ALL USING (user_has_tenant_access(tenant_id));

-- Triggers
DROP TRIGGER IF EXISTS update_medications_updated_at ON medications;
CREATE TRIGGER update_medications_updated_at 
BEFORE UPDATE ON medications 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Force schema cache refresh just in case
NOTIFY pgrst, 'reload schema';
