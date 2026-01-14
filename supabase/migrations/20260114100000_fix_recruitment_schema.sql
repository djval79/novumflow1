
-- Fix Recruitment Schema Mismatches

-- 1. Add 'notes' to interviews table (used in InterviewService.ts)
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Add 'position' and 'custom_data' to applications table (used in AddApplicationModal.tsx)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;

-- 3. Create document_templates table (used in generate-document function)
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g. 'offer_letter', 'contract'
    template_content TEXT NOT NULL, -- HTML or Text content with placeholders
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create documents table (used in generate-document function)
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

-- Seed a default template for Offer Letter if empty
INSERT INTO document_templates (name, category, template_content)
VALUES (
  'Standard Offer Letter', 
  'offer_letter', 
  'Dear {{applicant_first_name}},\n\nWe are pleased to offer you the position of {{position}} at our company.\n\nStart Date: {{start_date}}\nSalary: {{salary}}\n\nSincerely,\nHR Team'
) ON CONFLICT (name) DO NOTHING;
