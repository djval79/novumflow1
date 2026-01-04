-- Migration: Add Employee Onboarding Checklists
-- Tracks onboarding progress for each employee

-- Table to store assigned checklists to employees
CREATE TABLE IF NOT EXISTS employee_onboarding_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    template_id UUID REFERENCES onboarding_checklist_templates(id) ON DELETE SET NULL,
    template_name TEXT NOT NULL, -- Denormalized for history
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'cancelled')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table to track individual task completion within a checklist
CREATE TABLE IF NOT EXISTS onboarding_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES employee_onboarding_checklists(id) ON DELETE CASCADE,
    task_name TEXT NOT NULL,
    task_order INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_onboarding_employee ON employee_onboarding_checklists(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_onboarding_tenant ON employee_onboarding_checklists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_onboarding_status ON employee_onboarding_checklists(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_items_checklist ON onboarding_checklist_items(checklist_id);

-- RLS Policies
ALTER TABLE employee_onboarding_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklist_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view checklists for their tenant
CREATE POLICY "Tenant users can view onboarding checklists"
ON employee_onboarding_checklists FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM users_profiles WHERE id = auth.uid()
    )
);

-- Policy: Users can insert checklists for their tenant
CREATE POLICY "Tenant users can create onboarding checklists"
ON employee_onboarding_checklists FOR INSERT
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM users_profiles WHERE id = auth.uid()
    )
);

-- Policy: Users can update checklists for their tenant
CREATE POLICY "Tenant users can update onboarding checklists"
ON employee_onboarding_checklists FOR UPDATE
USING (
    tenant_id IN (
        SELECT tenant_id FROM users_profiles WHERE id = auth.uid()
    )
);

-- Policy for items - based on parent checklist's tenant
CREATE POLICY "Tenant users can view checklist items"
ON onboarding_checklist_items FOR SELECT
USING (
    checklist_id IN (
        SELECT id FROM employee_onboarding_checklists 
        WHERE tenant_id IN (
            SELECT tenant_id FROM users_profiles WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Tenant users can manage checklist items"
ON onboarding_checklist_items FOR ALL
USING (
    checklist_id IN (
        SELECT id FROM employee_onboarding_checklists 
        WHERE tenant_id IN (
            SELECT tenant_id FROM users_profiles WHERE id = auth.uid()
        )
    )
);

-- Function to auto-complete checklist when all items are done
CREATE OR REPLACE FUNCTION update_checklist_completion_status()
RETURNS TRIGGER AS $$
DECLARE
    total_items INTEGER;
    completed_items INTEGER;
BEGIN
    -- Count items
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_completed = TRUE)
    INTO total_items, completed_items
    FROM onboarding_checklist_items
    WHERE checklist_id = NEW.checklist_id;

    -- If all items complete, mark checklist as completed
    IF total_items > 0 AND total_items = completed_items THEN
        UPDATE employee_onboarding_checklists
        SET status = 'completed', completed_at = NOW(), updated_at = NOW()
        WHERE id = NEW.checklist_id AND status != 'completed';
    ELSIF completed_items > 0 THEN
        UPDATE employee_onboarding_checklists
        SET status = 'in_progress', updated_at = NOW()
        WHERE id = NEW.checklist_id AND status = 'not_started';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-completion
DROP TRIGGER IF EXISTS trigger_checklist_item_completion ON onboarding_checklist_items;
CREATE TRIGGER trigger_checklist_item_completion
AFTER UPDATE OF is_completed ON onboarding_checklist_items
FOR EACH ROW
EXECUTE FUNCTION update_checklist_completion_status();

-- Grant service role full access
GRANT ALL ON employee_onboarding_checklists TO service_role;
GRANT ALL ON onboarding_checklist_items TO service_role;
