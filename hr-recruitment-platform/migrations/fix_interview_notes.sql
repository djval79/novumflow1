-- Add notes column to interviews table
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS notes TEXT;
