CREATE TABLE document_templates (
    id bigserial PRIMARY KEY,
    template_name text NOT NULL,
    template_type text NOT NULL,
    template_content text NOT NULL, -- Using 'text' for HTML content
    is_active boolean DEFAULT TRUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Trigger to automatically update 'updated_at' on row modification
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON document_templates
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Seed some initial templates (examples)
INSERT INTO document_templates (template_name, template_type, template_content) VALUES
('Standard Offer Letter', 'offer_letter', '<h1>Offer of Employment</h1><p>Dear {{applicant_first_name}},</p><p>We are pleased to offer you the position of {{job_title}}.</p>...'),
('Contractor Agreement', 'contract', '<h1>Contractor Agreement</h1><p>This agreement is between NovumFlow and {{applicant_first_name}} {{applicant_last_name}}.</p>...');
