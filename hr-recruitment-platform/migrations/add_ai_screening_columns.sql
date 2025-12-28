-- ============================================================================
-- ADD AI SCREENING COLUMNS TO APPLICATIONS
-- ============================================================================

-- Add ai_score and ai_summary columns to applications table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'applications' AND COLUMN_NAME = 'ai_score') THEN
        ALTER TABLE applications ADD COLUMN ai_score INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'applications' AND COLUMN_NAME = 'ai_summary') THEN
        ALTER TABLE applications ADD COLUMN ai_summary TEXT;
    END IF;
END $$;

-- Grant permissions to service_role (redundant but safe)
GRANT ALL ON applications TO service_role;

-- Verification
SELECT 'Columns ai_score and ai_summary added to applications table.' as status;
