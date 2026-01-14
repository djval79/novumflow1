
-- Bootstrap Prerequisites
-- This migration creates tables that are referenced as foreign keys by subsequent migrations.

-- 1. Form Templates (found in add_form_builder_tables.sql)
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    schema JSONB NOT NULL DEFAULT '[]', -- Array of field definitions
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Documents (from 20260114 fix, moved earlier to satisfy references)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100),
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    file_path TEXT NOT NULL, -- Storage path
    uploaded_by VARCHAR(255), -- System or User ID
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Document Templates (used in generate-document function)
-- This table already exists from 20251203, so we just ensure columns match
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_templates') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_templates' AND column_name = 'template_name') THEN
            ALTER TABLE document_templates RENAME COLUMN name TO template_name;
        END IF;
    ELSE
        CREATE TABLE document_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            template_name VARCHAR(255) NOT NULL,
            template_type VARCHAR(100) NOT NULL,
            template_content TEXT NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
        );
    END IF;
END $$;

-- Seed a default template for Offer Letter
INSERT INTO document_templates (template_name, template_type, template_content)
SELECT 'Standard Offer Letter', 'offer_letter', 'Dear {{applicant_first_name}},\n\nWe are pleased to offer you the position of {{position}} at our company.\n\nSincerely,\nHR Team'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE template_name = 'Standard Offer Letter');

-- Seed Standard Job Application form
INSERT INTO form_templates (name, description, schema, is_active)
SELECT 'Standard Job Application', 'Default application form', '[]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM form_templates WHERE name = 'Standard Job Application');

-- Add RLS for form_templates
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Basic policies (authenticated = all access for now to avoid blocking)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all' AND tablename = 'form_templates') THEN
        CREATE POLICY "authenticated_all" ON form_templates FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all' AND tablename = 'documents') THEN
        CREATE POLICY "authenticated_all" ON documents FOR ALL TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_all' AND tablename = 'document_templates') THEN
        CREATE POLICY "authenticated_all" ON document_templates FOR ALL TO authenticated USING (true);
    END IF;
END $$;
