-- ============================================================================
-- RECRUITMENT SETTINGS & ONBOARDING TEMPLATES
-- ============================================================================

-- 1. Create recruitment_settings table
CREATE TABLE IF NOT EXISTS recruitment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    auto_acknowledge_applications BOOLEAN DEFAULT true,
    auto_schedule_reminders BOOLEAN DEFAULT true,
    enable_ai_screening BOOLEAN DEFAULT true,
    acknowledgement_email_template_id UUID,
    interview_reminder_template_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- 2. Create onboarding_checklist_templates table
CREATE TABLE IF NOT EXISTS onboarding_checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    tasks JSONB NOT NULL DEFAULT '[]', -- Array of strings or objects
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create evaluation_criteria_templates table
CREATE TABLE IF NOT EXISTS evaluation_criteria_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    weight INTEGER DEFAULT 25,
    max_score INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Initial Seed Data
INSERT INTO recruitment_settings (auto_acknowledge_applications, auto_schedule_reminders)
VALUES (true, true)
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO onboarding_checklist_templates (name, description, tasks)
VALUES 
('IT Setup', 'Standard IT onboarding for new employees', '["Create email account", "Setup workstation", "Install software", "Provide access cards"]'),
('HR Orientation', 'Standard HR onboarding process', '["Welcome meeting", "Handbook review", "Benefits enrollment", "Emergency contacts"]');

INSERT INTO evaluation_criteria_templates (name, weight, max_score)
VALUES 
('Technical Skills', 30, 10),
('Communication', 25, 10),
('Experience', 25, 10),
('Cultural Fit', 20, 10);

-- 5. Application Acknowledgement Trigger
CREATE OR REPLACE FUNCTION handle_new_application_confirmation()
RETURNS TRIGGER AS $$
DECLARE
    ack_enabled BOOLEAN;
    template_id UUID;
    candidate_name TEXT;
    job_title TEXT;
    company_name TEXT := 'NovumFlow'; -- Default or get from company_settings
BEGIN
    -- Check if auto-acknowledgement is enabled
    SELECT auto_acknowledge_applications INTO ack_enabled FROM recruitment_settings LIMIT 1;
    
    IF ack_enabled THEN
        candidate_name := NEW.applicant_first_name || ' ' || NEW.applicant_last_name;
        
        SELECT jt.job_title INTO job_title FROM job_postings jt WHERE jt.id = NEW.job_posting_id;
        
        -- Insert log for automation engine to pick up
        INSERT INTO automation_execution_logs (
            trigger_event,
            trigger_data,
            execution_status,
            created_at
        ) VALUES (
            'application_received',
            jsonb_build_object(
                'application_id', NEW.id,
                'candidate_email', NEW.applicant_email,
                'candidate_name', candidate_name,
                'job_title', job_title,
                'company_name', company_name,
                'template_name', 'application_confirmation'
            ),
            'pending',
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_application_created
AFTER INSERT ON applications
FOR EACH ROW EXECUTE FUNCTION handle_new_application_confirmation();
