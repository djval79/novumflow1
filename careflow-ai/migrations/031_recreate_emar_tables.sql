-- Completely drop and recreate eMAR tables to fix schema cache
DROP TABLE IF EXISTS medication_logs CASCADE;
DROP TABLE IF EXISTS medications CASCADE;

-- Create Medications Table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    route TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Discontinued')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Medication Logs Table
CREATE TABLE medication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    
    status TEXT NOT NULL CHECK (status IN ('Administered', 'Refused', 'Omitted')),
    notes TEXT,
    administered_at TIMESTAMPTZ DEFAULT NOW(),
    administered_by UUID NOT NULL REFERENCES employees(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can access medications in their tenant"
ON medications FOR ALL USING (user_has_tenant_access(tenant_id));

CREATE POLICY "Users can access medication logs in their tenant"
ON medication_logs FOR ALL USING (user_has_tenant_access(tenant_id));

-- Triggers
CREATE TRIGGER update_medications_updated_at 
BEFORE UPDATE ON medications 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
