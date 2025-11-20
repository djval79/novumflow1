-- Performance Goals Table
-- Tracks employee goals and objectives
CREATE TABLE IF NOT EXISTS performance_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) CHECK (goal_type IN ('individual', 'team', 'company', 'development')),
    category VARCHAR(100), -- e.g., "Sales Target", "Skill Development", "Project Delivery"
    target_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
        'draft',
        'active',
        'on_track',
        'at_risk',
        'achieved',
        'not_achieved',
        'cancelled'
    )),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    measurement_criteria TEXT, -- How success will be measured
    target_value VARCHAR(100), -- e.g., "10 sales", "Complete certification"
    current_value VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    linked_review_id UUID REFERENCES performance_reviews(id) ON DELETE SET NULL,
    parent_goal_id UUID REFERENCES performance_goals(id) ON DELETE CASCADE, -- For cascading goals
    is_smart BOOLEAN DEFAULT FALSE, -- Indicates if goal follows SMART criteria
    assigned_by UUID REFERENCES users_profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE performance_goals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Employees can view their own goals"
    ON performance_goals FOR SELECT
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
        -- Managers can see their team's goals
        employee_id IN (
            SELECT e.id FROM employees e
            WHERE e.manager_id IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Managers and HR can create goals"
    ON performance_goals FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'hr_manager')
        )
        OR
        -- Managers can create goals for their team
        employee_id IN (
            SELECT e.id FROM employees e
            WHERE e.manager_id IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Employees can update their own goals"
    ON performance_goals FOR UPDATE
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
        employee_id IN (
            SELECT e.id FROM employees e
            WHERE e.manager_id IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
        )
    );

-- Indexes
CREATE INDEX idx_performance_goals_employee ON performance_goals(employee_id);
CREATE INDEX idx_performance_goals_status ON performance_goals(status);
CREATE INDEX idx_performance_goals_target_date ON performance_goals(target_date);
CREATE INDEX idx_performance_goals_review ON performance_goals(linked_review_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_performance_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_performance_goals_updated_at
    BEFORE UPDATE ON performance_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_performance_goals_updated_at();

-- Function to auto-update goal status based on progress
CREATE OR REPLACE FUNCTION update_goal_status_from_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.progress_percentage = 100 THEN
        NEW.status = 'achieved';
    ELSIF NEW.progress_percentage >= 75 THEN
        NEW.status = 'on_track';
    ELSIF NEW.progress_percentage >= 50 AND NEW.target_date < CURRENT_DATE + INTERVAL '30 days' THEN
        NEW.status = 'at_risk';
    ELSIF NEW.target_date < CURRENT_DATE AND NEW.progress_percentage < 100 THEN
        NEW.status = 'not_achieved';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_status
    BEFORE UPDATE OF progress_percentage ON performance_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_status_from_progress();
