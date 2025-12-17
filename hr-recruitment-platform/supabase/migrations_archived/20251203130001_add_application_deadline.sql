-- Add application_deadline column to job_postings table
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS application_deadline DATE;
