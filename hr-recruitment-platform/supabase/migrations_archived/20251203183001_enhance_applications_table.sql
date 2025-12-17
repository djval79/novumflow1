-- ENHANCE APPLICATIONS TABLE FOR DATA INTEGRITY AND KPIs

-- Add offer_sent_at and offer_accepted_at for Time-to-Hire and Offer Acceptance Rate KPIs
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS offer_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS offer_accepted_at TIMESTAMPTZ;

-- Add NOT NULL constraint to cv_url if it's always expected for AI screening
-- IMPORTANT: Only run this if existing data already has CVs or if you handle NULLs
-- For this exercise, we assume CVs are crucial for screening.
-- ALTER TABLE applications ALTER COLUMN cv_url SET NOT NULL; -- Commented out to be safe with existing data

-- Add a unique constraint to prevent duplicate applications for the same job posting by the same email
ALTER TABLE applications
ADD CONSTRAINT unique_application_per_job_email UNIQUE (job_posting_id, applicant_email);

-- Optional: Add indexes for new columns if they will be frequently queried
CREATE INDEX IF NOT EXISTS idx_applications_offer_sent_at ON applications(offer_sent_at);
CREATE INDEX IF NOT EXISTS idx_applications_offer_accepted_at ON applications(offer_accepted_at);
