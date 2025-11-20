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
