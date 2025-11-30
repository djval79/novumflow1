-- Completely drop and recreate the table to ensure it has the correct columns
DROP TABLE IF EXISTS care_plans CASCADE;

CREATE TABLE care_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    summary TEXT,
    tasks JSONB DEFAULT '[]', -- Array of { id, label }
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(client_id)
);

-- Re-enable RLS
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access care plans in their tenant"
ON care_plans FOR ALL USING (user_has_tenant_access(tenant_id));

-- Re-create Trigger
CREATE TRIGGER update_care_plans_updated_at 
BEFORE UPDATE ON care_plans 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
