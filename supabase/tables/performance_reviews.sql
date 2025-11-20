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
