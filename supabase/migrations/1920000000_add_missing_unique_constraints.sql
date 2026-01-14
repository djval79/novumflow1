
-- Add missing unique constraints
-- This ensures that ON CONFLICT correctly identifies the target columns.

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_templates') THEN
        -- Ensure name is UNIQUE for ON CONFLICT
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'document_templates' 
            AND constraint_name = 'document_templates_name_unique'
        ) THEN
            ALTER TABLE document_templates ADD CONSTRAINT document_templates_name_unique UNIQUE (name);
        END IF;
    END IF;
END $$;
