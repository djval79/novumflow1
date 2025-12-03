-- Add location and duration to interviews table
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60; -- Duration in minutes

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'interviews' AND column_name IN ('location', 'duration');
