-- Fix BUG-006: Add missing interviewer_id column to interviews table

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interviews' AND column_name = 'interviewer_id'
    ) THEN
        ALTER TABLE interviews ADD COLUMN interviewer_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added interviewer_id column to interviews table';
    ELSE
        RAISE NOTICE 'interviewer_id column already exists in interviews table';
    END IF;
END $$;
