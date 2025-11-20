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
