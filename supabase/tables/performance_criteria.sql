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
