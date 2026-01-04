-- Migration: Incident & Accident Reporting
-- For CQC compliance and duty of care tracking

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Reference
    incident_reference TEXT, -- e.g., 'INC-2024-001'
    
    -- Type & Category
    incident_type TEXT NOT NULL, -- 'accident', 'near_miss', 'safeguarding', 'medication_error', 'behavioral', 'environmental', 'other'
    category TEXT, -- 'fall', 'injury', 'medication', 'abuse', 'neglect', 'property', 'security', 'other'
    severity TEXT NOT NULL DEFAULT 'minor', -- 'minor', 'moderate', 'major', 'critical'
    
    -- When & Where
    incident_date DATE NOT NULL,
    incident_time TIME,
    location TEXT, -- Description of where it occurred
    location_type TEXT, -- 'client_home', 'office', 'care_home', 'hospital', 'public', 'other'
    
    -- Who was involved
    reported_by UUID REFERENCES auth.users(id),
    clients_involved UUID[], -- Array of client IDs
    employees_involved UUID[], -- Array of employee IDs
    witnesses TEXT[], -- Names of witnesses
    
    -- Description
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    immediate_action_taken TEXT,
    
    -- Injuries
    injuries_sustained BOOLEAN DEFAULT FALSE,
    injury_details TEXT,
    medical_attention_required BOOLEAN DEFAULT FALSE,
    medical_attention_details TEXT,
    
    -- External Reporting
    notified_police BOOLEAN DEFAULT FALSE,
    police_reference TEXT,
    notified_cqc BOOLEAN DEFAULT FALSE,
    cqc_reference TEXT,
    notified_local_authority BOOLEAN DEFAULT FALSE,
    notified_family BOOLEAN DEFAULT FALSE,
    
    -- Investigation
    investigation_required BOOLEAN DEFAULT FALSE,
    investigation_status TEXT DEFAULT 'not_required', -- 'not_required', 'pending', 'in_progress', 'completed'
    investigator_id UUID REFERENCES auth.users(id),
    investigation_started_at TIMESTAMPTZ,
    investigation_completed_at TIMESTAMPTZ,
    investigation_findings TEXT,
    
    -- Root Cause
    root_cause TEXT,
    contributing_factors TEXT[],
    
    -- Actions & Recommendations
    corrective_actions TEXT,
    preventive_measures TEXT,
    lessons_learned TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'reported', -- 'reported', 'under_review', 'investigating', 'resolved', 'closed'
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    
    -- Review
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Attachments/Evidence
    attachments JSONB DEFAULT '[]', -- Array of {name, url, type}
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incident Timeline/Activity Log
CREATE TABLE IF NOT EXISTS incident_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    
    action_type TEXT NOT NULL, -- 'created', 'updated', 'status_change', 'note_added', 'investigation_started', 'investigation_completed', 'resolved', 'escalated'
    action_description TEXT NOT NULL,
    
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incident Actions (follow-up tasks)
CREATE TABLE IF NOT EXISTS incident_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    
    action_description TEXT NOT NULL,
    assigned_to UUID REFERENCES auth.users(id),
    due_date DATE,
    
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue'
    
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    completion_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generate incident reference function
CREATE OR REPLACE FUNCTION generate_incident_reference()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    seq_num INTEGER;
    new_ref TEXT;
BEGIN
    year_part := to_char(NEW.incident_date, 'YYYY');
    
    -- Get the next sequence number for this tenant and year
    SELECT COALESCE(MAX(
        NULLIF(regexp_replace(incident_reference, '^INC-' || year_part || '-', ''), '')::INTEGER
    ), 0) + 1
    INTO seq_num
    FROM incidents
    WHERE tenant_id = NEW.tenant_id
    AND incident_reference LIKE 'INC-' || year_part || '-%';
    
    new_ref := 'INC-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    NEW.incident_reference := new_ref;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generating reference
DROP TRIGGER IF EXISTS trg_generate_incident_reference ON incidents;
CREATE TRIGGER trg_generate_incident_reference
    BEFORE INSERT ON incidents
    FOR EACH ROW
    WHEN (NEW.incident_reference IS NULL)
    EXECUTE FUNCTION generate_incident_reference();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_tenant ON incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incident_timeline_incident ON incident_timeline(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_actions_incident ON incident_actions(incident_id);

-- RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_actions ENABLE ROW LEVEL SECURITY;

-- Incidents policies
CREATE POLICY "Tenant users can view incidents"
ON incidents FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage incidents"
ON incidents FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Timeline policies
CREATE POLICY "Users can view incident timeline"
ON incident_timeline FOR SELECT
USING (
    incident_id IN (
        SELECT id FROM incidents 
        WHERE tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can add to incident timeline"
ON incident_timeline FOR INSERT
WITH CHECK (
    incident_id IN (
        SELECT id FROM incidents 
        WHERE tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid())
    )
);

-- Actions policies
CREATE POLICY "Users can view incident actions"
ON incident_actions FOR SELECT
USING (
    incident_id IN (
        SELECT id FROM incidents 
        WHERE tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can manage incident actions"
ON incident_actions FOR ALL
USING (
    incident_id IN (
        SELECT id FROM incidents 
        WHERE tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid())
    )
);

-- Grants
GRANT ALL ON incidents TO service_role;
GRANT ALL ON incident_timeline TO service_role;
GRANT ALL ON incident_actions TO service_role;
