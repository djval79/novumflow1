-- Performance Management Module Migration
-- Run this file to create all performance management tables in your Supabase database
-- Execute in order - tables have dependencies
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Performance Review Types
-- Performance Review Types Table
-- Allows admins to define custom review types (probation, annual, 360, etc.)
CREATE TABLE IF NOT EXISTS performance_review_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    frequency VARCHAR(50) CHECK (frequency IN ('one-time', 'quarterly', 'semi-annual', 'annual', 'custom')),
    auto_schedule BOOLEAN DEFAULT FALSE,
    schedule_offset_days INTEGER, -- Days after employee start date or last review
    trigger_event VARCHAR(50) CHECK (trigger_event IN ('hire_date', 'last_review', 'manual', 'anniversary', 'end_of_probation')),
    duration_days INTEGER DEFAULT 14, -- How long the review period stays open
    requires_self_assessment BOOLEAN DEFAULT FALSE,
    requires_manager_review BOOLEAN DEFAULT TRUE,
    requires_peer_review BOOLEAN DEFAULT FALSE,
    peer_review_count INTEGER DEFAULT 0,
    allow_skip_level_review BOOLEAN DEFAULT FALSE, -- Manager's manager can review
    rating_scale_type VARCHAR(50) DEFAULT '1-5' CHECK (rating_scale_type IN ('1-5', '1-10', 'A-F', 'custom', 'none')),
    passing_threshold DECIMAL(3,2), -- e.g., 3.0 for 1-5 scale
    is_active BOOLEAN DEFAULT TRUE,
    notification_template TEXT,
    created_by UUID NOT NULL REFERENCES users_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE performance_review_types ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active review types"
    ON performance_review_types FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Admins and HR can manage review types"
    ON performance_review_types FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'hr_manager')
        )
    );

-- Indexes
CREATE INDEX idx_performance_review_types_active ON performance_review_types(is_active);
CREATE INDEX idx_performance_review_types_auto_schedule ON performance_review_types(auto_schedule, trigger_event);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_performance_review_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_performance_review_types_updated_at
    BEFORE UPDATE ON performance_review_types
    FOR EACH ROW
    EXECUTE FUNCTION update_performance_review_types_updated_at();

/*
-- Insert default review types
INSERT INTO performance_review_types (name, description, frequency, auto_schedule, schedule_offset_days, trigger_event, requires_self_assessment, requires_manager_review, rating_scale_type, created_by)
SELECT 
    'Probation Review',
    'End of probation period review for new employees',
    'one-time',
    TRUE,
    85, -- 85 days after hire (before 90 day probation ends)
    'hire_date',
    TRUE,
    TRUE,
    '1-5',
    up.user_id
FROM users_profiles up WHERE up.role = 'admin' LIMIT 1;

INSERT INTO performance_review_types (name, description, frequency, auto_schedule, schedule_offset_days, trigger_event, requires_self_assessment, requires_manager_review, requires_peer_review, peer_review_count, rating_scale_type, created_by)
SELECT 
    'Annual Performance Review',
    'Comprehensive annual performance evaluation',
    'annual',
    TRUE,
    89,
    'anniversary',
    TRUE,
    TRUE,
    TRUE,
    3,
    '1-5',
    up.user_id
FROM users_profiles up WHERE up.role = 'admin' LIMIT 1;

INSERT INTO performance_review_types (name, description, frequency, auto_schedule, schedule_offset_days, trigger_event, requires_self_assessment, requires_manager_review, rating_scale_type, created_by)
SELECT 
    'Quarterly Check-in',
    'Quarterly performance and goal review',
    'quarterly',
    TRUE,
    90,
    'last_review',
    TRUE,
    TRUE,
    '1-5',
    up.user_id
FROM users_profiles up WHERE up.role = 'admin' LIMIT 1;

INSERT INTO performance_review_types (name, description, frequency, auto_schedule, trigger_event, requires_self_assessment, requires_manager_review, requires_peer_review, peer_review_count, allow_skip_level_review, rating_scale_type, created_by)
SELECT 
    '360-Degree Review',
    'Comprehensive 360-degree feedback from multiple sources',
    'custom',
    FALSE,
    NULL,
    'manual',
    TRUE,
    TRUE,
    TRUE,
    5,
    TRUE,
    '1-5',
    up.user_id
FROM users_profiles up WHERE up.role = 'admin' LIMIT 1;

INSERT INTO performance_review_types (name, description, frequency, auto_schedule, trigger_event, requires_self_assessment, requires_manager_review, rating_scale_type, created_by)
SELECT 
    'Performance Improvement Plan (PIP)',
    'Structured improvement plan for underperforming employees',
    'custom',
    FALSE,
    NULL,
    'manual',
    FALSE,
    TRUE,
    '1-5',
    up.user_id
FROM users_profiles up WHERE up.role = 'admin' LIMIT 1;
*/

-- 2. Performance Criteria
-- Performance Criteria Table
-- Defines evaluation criteria that can be customized per review type
CREATE TABLE IF NOT EXISTS performance_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_type_id UUID REFERENCES performance_review_types(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- e.g., "Technical Skills", "Communication", "Leadership"
    criterion_name VARCHAR(200) NOT NULL,
    description TEXT,
    weight DECIMAL(5,2) DEFAULT 1.0, -- Weighting for overall score calculation
    is_required BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE performance_criteria ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view performance criteria"
    ON performance_criteria FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins and HR can manage criteria"
    ON performance_criteria FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'hr_manager')
        )
    );

-- Indexes
CREATE INDEX idx_performance_criteria_review_type ON performance_criteria(review_type_id);
CREATE INDEX idx_performance_criteria_category ON performance_criteria(category);
CREATE INDEX idx_performance_criteria_order ON performance_criteria(display_order);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_performance_criteria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_performance_criteria_updated_at
    BEFORE UPDATE ON performance_criteria
    FOR EACH ROW
    EXECUTE FUNCTION update_performance_criteria_updated_at();

/*
-- Insert default criteria for Annual Performance Review
INSERT INTO performance_criteria (review_type_id, category, criterion_name, description, weight, display_order, created_by)
SELECT 
    prt.id,
    'Job Performance',
    'Quality of Work',
    'Consistently delivers high-quality work that meets or exceeds expectations',
    1.5,
    1,
    up.user_id
FROM performance_review_types prt
CROSS JOIN users_profiles up
WHERE prt.name = 'Annual Performance Review' 
AND up.role = 'admin'
LIMIT 1;

INSERT INTO performance_criteria (review_type_id, category, criterion_name, description, weight, display_order, created_by)
SELECT 
    prt.id,
    'Job Performance',
    'Productivity',
    'Effectively manages time and completes tasks efficiently',
    1.0,
    2,
    up.user_id
FROM performance_review_types prt
CROSS JOIN users_profiles up
WHERE prt.name = 'Annual Performance Review' 
AND up.role = 'admin'
LIMIT 1;

INSERT INTO performance_criteria (review_type_id, category, criterion_name, description, weight, display_order, created_by)
SELECT 
    prt.id,
    'Communication',
    'Team Collaboration',
    'Works effectively with team members and contributes to team success',
    1.0,
    3,
    up.user_id
FROM performance_review_types prt
CROSS JOIN users_profiles up
WHERE prt.name = 'Annual Performance Review' 
AND up.role = 'admin'
LIMIT 1;

INSERT INTO performance_criteria (review_type_id, category, criterion_name, description, weight, display_order, created_by)
SELECT 
    prt.id,
    'Communication',
    'Communication Skills',
    'Communicates clearly and professionally with stakeholders',
    1.0,
    4,
    up.user_id
FROM performance_review_types prt
CROSS JOIN users_profiles up
WHERE prt.name = 'Annual Performance Review' 
AND up.role = 'admin'
LIMIT 1;

INSERT INTO performance_criteria (review_type_id, category, criterion_name, description, weight, display_order, created_by)
SELECT 
    prt.id,
    'Professional Development',
    'Initiative & Innovation',
    'Takes initiative and brings innovative solutions to problems',
    1.0,
    5,
    up.user_id
FROM performance_review_types prt
CROSS JOIN users_profiles up
WHERE prt.name = 'Annual Performance Review' 
AND up.role = 'admin'
LIMIT 1;

INSERT INTO performance_criteria (review_type_id, category, criterion_name, description, weight, display_order, created_by)
SELECT 
    prt.id,
    'Professional Development',
    'Learning & Growth',
    'Demonstrates commitment to continuous learning and skill development',
    1.0,
    6,
    up.user_id
FROM performance_review_types prt
CROSS JOIN users_profiles up
WHERE prt.name = 'Annual Performance Review' 
AND up.role = 'admin'
LIMIT 1;

INSERT INTO performance_criteria (review_type_id, category, criterion_name, description, weight, display_order, created_by)
SELECT 
    prt.id,
    'Reliability',
    'Attendance & Punctuality',
    'Maintains excellent attendance and punctuality',
    0.5,
    7,
    up.user_id
FROM performance_review_types prt
CROSS JOIN users_profiles up
WHERE prt.name = 'Annual Performance Review' 
AND up.role = 'admin'
LIMIT 1;

INSERT INTO performance_criteria (review_type_id, category, criterion_name, description, weight, display_order, created_by)
SELECT 
    prt.id,
    'Reliability',
    'Dependability',
    'Can be relied upon to complete assignments and meet commitments',
    1.0,
    8,
    up.user_id
FROM performance_review_types prt
CROSS JOIN users_profiles up
WHERE prt.name = 'Annual Performance Review' 
AND up.role = 'admin'
LIMIT 1;
*/

-- 3. Performance Reviews
-- Performance Reviews Table
-- Stores individual review instances
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_type_id UUID NOT NULL REFERENCES performance_review_types(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    review_due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 
        'in_progress', 
        'self_assessment_complete',
        'manager_review_complete',
        'peer_review_complete',
        'completed', 
        'overdue',
        'cancelled'
    )),
    overall_rating DECIMAL(4,2), -- Calculated weighted average
    overall_comments TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    action_items TEXT,
    next_review_date DATE,
    is_auto_generated BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Employees can view their own reviews"
    ON performance_reviews FOR SELECT
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
        -- Managers can see their team's reviews
        employee_id IN (
            SELECT e.id FROM employees e
            WHERE e.manager_id IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins and HR can create reviews"
    ON performance_reviews FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'hr_manager')
        )
    );

CREATE POLICY "Admins, HR, and managers can update reviews"
    ON performance_reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'hr_manager')
        )
        OR
        -- Managers can update their team's reviews
        employee_id IN (
            SELECT e.id FROM employees e
            WHERE e.manager_id IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
        )
    );

-- Indexes
CREATE INDEX idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX idx_performance_reviews_status ON performance_reviews(status);
CREATE INDEX idx_performance_reviews_type ON performance_reviews(review_type_id);
CREATE INDEX idx_performance_reviews_due_date ON performance_reviews(review_due_date);
CREATE INDEX idx_performance_reviews_period ON performance_reviews(review_period_start, review_period_end);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_performance_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_performance_reviews_updated_at
    BEFORE UPDATE ON performance_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_performance_reviews_updated_at();

-- Function to auto-update status to overdue
CREATE OR REPLACE FUNCTION update_overdue_reviews()
RETURNS void AS $$
BEGIN
    UPDATE performance_reviews
    SET status = 'overdue'
    WHERE status IN ('pending', 'in_progress')
    AND review_due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 4. Review Participants
-- Review Participants Table
-- Tracks who needs to provide feedback for each review
CREATE TABLE IF NOT EXISTS review_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES users_profiles(user_id) ON DELETE CASCADE,
    participant_type VARCHAR(50) NOT NULL CHECK (participant_type IN (
        'self',
        'manager',
        'peer',
        'skip_level',
        'subordinate'
    )),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'in_progress',
        'completed',
        'skipped'
    )),
    submitted_at TIMESTAMP,
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(review_id, participant_id, participant_type)
);

-- Enable RLS
ALTER TABLE review_participants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Participants can view their assigned reviews"
    ON review_participants FOR SELECT
    USING (
        participant_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'hr_manager')
        )
    );

CREATE POLICY "Admins and HR can manage participants"
    ON review_participants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'hr_manager')
        )
    );

-- Indexes
CREATE INDEX idx_review_participants_review ON review_participants(review_id);
CREATE INDEX idx_review_participants_participant ON review_participants(participant_id);
CREATE INDEX idx_review_participants_status ON review_participants(status);
CREATE INDEX idx_review_participants_type ON review_participants(participant_type);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_review_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_participants_updated_at
    BEFORE UPDATE ON review_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_review_participants_updated_at();

-- 5. Performance Ratings
-- Performance Ratings Table
-- Stores individual criterion ratings from each participant
CREATE TABLE IF NOT EXISTS performance_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES review_participants(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES performance_criteria(id) ON DELETE CASCADE,
    rating DECIMAL(4,2) NOT NULL,
    comments TEXT,
    examples TEXT, -- Specific examples supporting the rating
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE performance_ratings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Participants can manage their own ratings"
    ON performance_ratings FOR ALL
    USING (
        participant_id IN (
            SELECT id FROM review_participants WHERE participant_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'hr_manager')
        )
    );

CREATE POLICY "Review subjects and managers can view ratings"
    ON performance_ratings FOR SELECT
    USING (
        -- Employee can see ratings for their own review
        review_id IN (
            SELECT pr.id FROM performance_reviews pr
            JOIN employees e ON pr.employee_id = e.id
            WHERE e.user_id = auth.uid()
            AND pr.status = 'completed'
        )
        OR
        -- Managers can see their team's ratings
        review_id IN (
            SELECT pr.id FROM performance_reviews pr
            JOIN employees e ON pr.employee_id = e.id
            WHERE e.manager_id IN (
                SELECT id FROM employees WHERE user_id = auth.uid()
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM users_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'hr_manager')
        )
    );

-- Indexes
CREATE INDEX idx_performance_ratings_review ON performance_ratings(review_id);
CREATE INDEX idx_performance_ratings_participant ON performance_ratings(participant_id);
CREATE INDEX idx_performance_ratings_criterion ON performance_ratings(criterion_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_performance_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_performance_ratings_updated_at
    BEFORE UPDATE ON performance_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_performance_ratings_updated_at();

-- 6. Performance Goals
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

-- 7. KPI Definitions
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
/*
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
*/

/*
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
*/

-- 8. KPI Values
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_reviews_composite ON performance_reviews(employee_id, status, review_due_date);
CREATE INDEX IF NOT EXISTS idx_performance_goals_composite ON performance_goals(employee_id, status, target_date);
CREATE INDEX IF NOT EXISTS idx_kpi_values_composite ON kpi_values(employee_id, kpi_definition_id, period_start);

-- Grant permissions
GRANT ALL ON performance_review_types TO authenticated;
GRANT ALL ON performance_criteria TO authenticated;
GRANT ALL ON performance_reviews TO authenticated;
GRANT ALL ON review_participants TO authenticated;
GRANT ALL ON performance_ratings TO authenticated;
GRANT ALL ON performance_goals TO authenticated;
GRANT ALL ON kpi_definitions TO authenticated;
GRANT ALL ON kpi_values TO authenticated;

-- Verify tables created
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE tablename LIKE 'performance%' 
   OR tablename LIKE 'review%' 
   OR tablename LIKE 'kpi%'
ORDER BY tablename;
