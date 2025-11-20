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
    user_id
FROM users_profiles WHERE role = 'admin' LIMIT 1;

INSERT INTO performance_review_types (name, description, frequency, auto_schedule, schedule_offset_days, trigger_event, requires_self_assessment, requires_manager_review, requires_peer_review, peer_review_count, rating_scale_type, created_by)
SELECT 
    'Annual Performance Review',
    'Comprehensive annual performance evaluation',
    'annual',
    TRUE,
    365,
    'anniversary',
    TRUE,
    TRUE,
    TRUE,
    3,
    '1-5',
    user_id
FROM users_profiles WHERE role = 'admin' LIMIT 1;

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
    user_id
FROM users_profiles WHERE role = 'admin' LIMIT 1;

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
    user_id
FROM users_profiles WHERE role = 'admin' LIMIT 1;

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
    user_id
FROM users_profiles WHERE role = 'admin' LIMIT 1;
