-- Add missing columns to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date TIMESTAMP WITH TIME ZONE;

-- Add missing columns to email_templates table
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS subject VARCHAR(255);
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS content TEXT;

-- Fix tenant_subscriptions table structure
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS subscription_plans TEXT[];