-- KPI Definitions Table
-- Defines Key Performance Indicators templates
CREATE TABLE IF NOT EXISTS kpi_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- e.g., "Sales", "Productivity", "Quality", "Financial"
    measurement_unit VARCHAR(50), -- e.g., "currency", "percentage", "count", "hours"
    target_type VARCHAR(50) CHECK (target_type IN ('above', 'below', 'exact', 'range')),
    calculation_method TEXT, -- How the KPI is calculated
    data_source VARCHAR(100), -- Where data comes from
    frequency VARCHAR(50) CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
    is_active BOOLEAN DEFAULT TRUE,
    applicable_roles TEXT[], -- Array of roles this KPI applies to
    created_by UUID NOT NULL REFERENCES users_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active KPI definitions"
    ON kpi_definitions FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Admins and HR can manage KPI definitions"
    ON kpi_definitions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'hr_manager')
        )
    );

-- Indexes
CREATE INDEX idx_kpi_definitions_category ON kpi_definitions(category);
CREATE INDEX idx_kpi_definitions_active ON kpi_definitions(is_active);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_kpi_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kpi_definitions_updated_at
    BEFORE UPDATE ON kpi_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_kpi_definitions_updated_at();

-- Insert default KPIs
INSERT INTO kpi_definitions (name, description, category, measurement_unit, target_type, frequency, applicable_roles, created_by)
SELECT 
    'Employee Retention Rate',
    'Percentage of employees retained over a specific period',
    'HR Metrics',
    'percentage',
    'above',
    'quarterly',
    ARRAY['hr_manager', 'admin'],
    user_id
FROM users_profiles WHERE role = 'admin' LIMIT 1;

INSERT INTO kpi_definitions (name, description, category, measurement_unit, target_type, frequency, applicable_roles, created_by)
SELECT 
    'Time to Hire',
    'Average number of days to fill open positions',
    'Recruitment',
    'count',
    'below',
    'monthly',
    ARRAY['recruiter', 'hr_manager', 'admin'],
    user_id
FROM users_profiles WHERE role = 'admin' LIMIT 1;

INSERT INTO kpi_definitions (name, description, category, measurement_unit, target_type, frequency, applicable_roles, created_by)
SELECT 
    'Training Hours per Employee',
    'Average training hours completed per employee',
    'Development',
    'hours',
    'above',
    'quarterly',
    ARRAY['hr_manager', 'admin'],
    user_id
FROM users_profiles WHERE role = 'admin' LIMIT 1;

INSERT INTO kpi_definitions (name, description, category, measurement_unit, target_type, frequency, applicable_roles, created_by)
SELECT 
    'Goal Achievement Rate',
    'Percentage of goals achieved by employees',
    'Performance',
    'percentage',
    'above',
    'quarterly',
    ARRAY['employee', 'hr_manager', 'admin'],
    user_id
FROM users_profiles WHERE role = 'admin' LIMIT 1;
