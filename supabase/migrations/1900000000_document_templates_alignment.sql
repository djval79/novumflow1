
-- Document Templates Alignment
-- Standardizes columns for document_templates across different versions.

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_templates') THEN
        -- Rename template_name to name
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'name') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'template_name') THEN
                ALTER TABLE document_templates RENAME COLUMN template_name TO name;
            ELSE
                ALTER TABLE document_templates ADD COLUMN name TEXT NOT NULL DEFAULT 'Untitled Template';
            END IF;
        END IF;

        -- Rename template_type to category (if needed, but usually templates have types)
        -- Let's check what the frontend uses: useDocuments.ts uses 'category'
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'category') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'template_type') THEN
                ALTER TABLE document_templates RENAME COLUMN template_type TO category;
            ELSE
                ALTER TABLE document_templates ADD COLUMN category TEXT;
            END IF;
        END IF;

        -- Add missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'description') THEN
            ALTER TABLE document_templates ADD COLUMN description TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'is_active') THEN
            ALTER TABLE document_templates ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;

        -- Ensure name is UNIQUE for ON CONFLICT
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'document_templates' 
            AND constraint_type = 'UNIQUE' 
            AND constraint_name = 'document_templates_name_key'
        ) THEN
            ALTER TABLE document_templates ADD CONSTRAINT document_templates_name_key UNIQUE (name);
        END IF;
    END IF;
END $$;
