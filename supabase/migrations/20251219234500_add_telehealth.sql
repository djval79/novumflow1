-- careflow_telehealth_sessions
CREATE TABLE IF NOT EXISTS careflow_telehealth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE,
    host_id UUID REFERENCES auth.users(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT DEFAULT 'Upcoming', -- Upcoming, Live, Completed, Cancelled
    topic TEXT,
    meeting_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- careflow_vital_readings
CREATE TABLE IF NOT EXISTS careflow_vital_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES careflow_clients(id) ON DELETE CASCADE,
    scanned_by UUID REFERENCES auth.users(id),
    type TEXT NOT NULL, -- e.g. "Blood Pressure", "Heart Rate", "SpO2", "Temperature", "Weight"
    value TEXT NOT NULL, -- e.g. "120/80", "72", "98", "36.5", "70"
    unit TEXT, -- e.g. "mmHg", "bpm", "%", "C", "kg"
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- RLS
ALTER TABLE careflow_telehealth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE careflow_vital_readings ENABLE ROW LEVEL SECURITY;

-- Policies (Standard Tenant Isolation)
CREATE POLICY "Users can view telehealth sessions in their tenant" ON careflow_telehealth_sessions
    FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Staff can manage telehealth sessions" ON careflow_telehealth_sessions
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can view vital readings in their tenant" ON careflow_vital_readings
    FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Staff can manage vital readings" ON careflow_vital_readings
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid() AND is_active = true));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_telehealth_tenant ON careflow_telehealth_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_telehealth_client ON careflow_telehealth_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_vitals_tenant ON careflow_vital_readings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vitals_client ON careflow_vital_readings(client_id);
