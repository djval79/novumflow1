-- KPI Values Table
-- Stores actual KPI measurements for employees
CREATE TABLE IF NOT EXISTS kpi_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_definition_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    department VARCHAR(100), -- For department-level KPIs
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    target_value DECIMAL(15,2),
    actual_value DECIMAL(15,2) NOT NULL,
    variance DECIMAL(15,2), -- actual_value - target_value (or % difference)
    status VARCHAR(50) CHECK (status IN ('on_target', 'above_target', 'below_target', 'needs_attention')),
    notes TEXT,
    data_entry_method VARCHAR(50) DEFAULT 'manual' CHECK (data_entry_method IN ('manual', 'automated', 'imported')),
    verified_by UUID REFERENCES users_profiles(user_id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT employee_or_dept_required CHECK (
        (employee_id IS NOT NULL AND department IS NULL) OR
        (employee_id IS NULL AND department IS NOT NULL)
    )
);

-- Enable RLS
ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Employees can view their own KPI values"
    ON kpi_values FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'hr_manager')
        )
        OR
        -- Managers can see their team's KPIs
        employee_id IN (
            SELECT e.id FROM employees e
            WHERE e.manager_id IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Managers and HR can manage KPI values"
    ON kpi_values FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'hr_manager')
        )
        OR
        employee_id IN (
            SELECT e.id FROM employees e
            WHERE e.manager_id IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
        )
    );

-- Indexes
CREATE INDEX idx_kpi_values_definition ON kpi_values(kpi_definition_id);
CREATE INDEX idx_kpi_values_employee ON kpi_values(employee_id);
CREATE INDEX idx_kpi_values_period ON kpi_values(period_start, period_end);
CREATE INDEX idx_kpi_values_department ON kpi_values(department);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_kpi_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kpi_values_updated_at
    BEFORE UPDATE ON kpi_values
    FOR EACH ROW
    EXECUTE FUNCTION update_kpi_values_updated_at();

-- Function to auto-calculate variance and status
CREATE OR REPLACE FUNCTION calculate_kpi_variance_and_status()
RETURNS TRIGGER AS $$
DECLARE
    kpi_target_type VARCHAR(50);
BEGIN
    -- Get target type from KPI definition
    SELECT target_type INTO kpi_target_type
    FROM kpi_definitions
    WHERE id = NEW.kpi_definition_id;
    
    -- Calculate variance
    IF NEW.target_value IS NOT NULL THEN
        NEW.variance = NEW.actual_value - NEW.target_value;
        
        -- Determine status based on target type
        IF kpi_target_type = 'above' THEN
            IF NEW.actual_value >= NEW.target_value THEN
                NEW.status = 'on_target';
            ELSIF NEW.actual_value >= NEW.target_value * 0.9 THEN
                NEW.status = 'below_target';
            ELSE
                NEW.status = 'needs_attention';
            END IF;
        ELSIF kpi_target_type = 'below' THEN
            IF NEW.actual_value <= NEW.target_value THEN
                NEW.status = 'on_target';
            ELSIF NEW.actual_value <= NEW.target_value * 1.1 THEN
                NEW.status = 'above_target';
            ELSE
                NEW.status = 'needs_attention';
            END IF;
        ELSE
            NEW.status = 'on_target';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_kpi_variance
    BEFORE INSERT OR UPDATE ON kpi_values
    FOR EACH ROW
    EXECUTE FUNCTION calculate_kpi_variance_and_status();
