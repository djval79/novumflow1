-- Universal Forms System Migration
-- This migration transforms the form system to support multiple form types across the platform

-- 1. Update form_templates table to support different form types
ALTER TABLE form_templates 
ADD COLUMN IF NOT EXISTS form_type TEXT DEFAULT 'application' 
CHECK (form_type IN ('application', 'evaluation', 'incident', 'training', 'leave', 'performance', 'other'));

ALTER TABLE form_templates 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'recruitment' 
CHECK (category IN ('recruitment', 'hr', 'compliance', 'operations', 'training'));

ALTER TABLE form_templates 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing forms to have proper type
UPDATE form_templates SET form_type = 'application', category = 'recruitment' WHERE form_type IS NULL;

-- 2. Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id UUID REFERENCES form_templates(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved', 'rejected')),
  response_data JSONB NOT NULL DEFAULT '{}',
  related_entity_type TEXT CHECK (related_entity_type IN ('employee', 'application', 'incident', NULL)),
  related_entity_id UUID,
  reviewer_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_template ON form_submissions(form_template_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_by ON form_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_entity ON form_submissions(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_form_templates_type ON form_templates(form_type);
CREATE INDEX IF NOT EXISTS idx_form_templates_category ON form_templates(category);

-- 4. Enable RLS on form_submissions
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for form_submissions
-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON form_submissions
  FOR SELECT
  USING (auth.uid() = submitted_by);

-- All authenticated users can view all submissions (adjust based on your needs)
CREATE POLICY "Authenticated users can view submissions" ON form_submissions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create submissions
CREATE POLICY "Users can create submissions" ON form_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

-- Users can update their own draft submissions
CREATE POLICY "Users can update own drafts" ON form_submissions
  FOR UPDATE
  USING (auth.uid() = submitted_by AND status = 'draft');

-- All authenticated users can update submissions (adjust based on your needs)
CREATE POLICY "Authenticated users can update submissions" ON form_submissions
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 6. Grant permissions
GRANT ALL ON form_submissions TO authenticated;

-- 7. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_form_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER form_submissions_updated_at
  BEFORE UPDATE ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_form_submissions_updated_at();

-- Verification
SELECT 'SUCCESS! Universal forms system created.' as status;
