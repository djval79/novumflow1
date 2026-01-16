-- Migration 019: CQC Mock Inspection Tool
-- Allows care managers to conduct internal audits against CQC KLOEs.

CREATE TABLE IF NOT EXISTS cqc_mock_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
    
    -- KLOE Scores (1-4: 1=Oustanding, 2=Good, 3=Requires Improvement, 4=Inadequate)
    safe_score INTEGER,
    effective_score INTEGER,
    caring_score INTEGER,
    responsive_score INTEGER,
    well_led_score INTEGER,
    
    -- Detailed Findings (JSONB)
    findings JSONB DEFAULT '{}',
    action_plan JSONB DEFAULT '[]',
    
    overall_score DECIMAL(5,2),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE cqc_mock_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tenant mock inspections"
ON cqc_mock_inspections FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM user_tenant_memberships 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_cqc_mock_tenant ON cqc_mock_inspections(tenant_id);
