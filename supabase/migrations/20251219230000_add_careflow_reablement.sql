
-- 1. Progress Logs for Reablement Tracker
CREATE TABLE IF NOT EXISTS careflow_progress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES careflow_clients(id) ON DELETE CASCADE,
    care_goal_id UUID REFERENCES careflow_care_goals(id) ON DELETE SET NULL, -- Optional link to a specific goal
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL, -- Personal Care, Mobility, Social, etc.
    note TEXT NOT NULL,
    mood VARCHAR(50) DEFAULT 'Neutral', -- Happy, Neutral, Sad, Agitated
    progress_score INT DEFAULT 5, -- 1-10
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE careflow_progress_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view progress logs in their tenant" ON careflow_progress_logs
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Staff can manage progress logs" ON careflow_progress_logs
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );
