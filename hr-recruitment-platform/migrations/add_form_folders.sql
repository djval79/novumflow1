-- Migration: Add folder field to form_templates table
-- Run this migration to add folder organization to forms

ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT 'general';

CREATE INDEX IF NOT EXISTS idx_form_templates_folder ON form_templates(folder);

COMMENT ON COLUMN form_templates.folder IS 'Folder/category for organizing forms (general, recruitment, hr, compliance, clinical, training, operations)';
