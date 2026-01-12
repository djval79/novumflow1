-- Add Stripe billing fields to tenants table
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text,
ADD COLUMN IF NOT EXISTS stripe_status text, -- active, trialing, past_due, canceled
ADD COLUMN IF NOT EXISTS billing_cycle_anchor timestamptz,
ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false;

-- Add index for customer lookup (webhook performance)
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer_id ON public.tenants(stripe_customer_id);

-- Add constraint to ensure customer ID is unique per tenant (if set)
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_stripe_customer_id_key;
ALTER TABLE public.tenants ADD CONSTRAINT tenants_stripe_customer_id_key UNIQUE (stripe_customer_id);

-- Enable RLS for these columns? 
-- Tenants should be able to READ their own status.
-- Only Service Role should WRITE these (via Webhook).
-- Check current RLS policies.
-- We assume "view own tenant" policy covers reading all columns.
-- We should ensure UPDATE policy does NOT allow user to change stripe_status directly.

-- Create a restrictive policy for updates if not already present?
-- Assuming existing policies allow Admin to update settings. We might want to trigger/function to prevent modifying stripe fields manually.
-- For now, relying on "Service Role operates webhooks" and "Frontend doesn't expose fields" is standard MVP.
