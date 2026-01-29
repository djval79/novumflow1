-- Add complyflow_enabled flag to tenants table
-- This allows for granular control of suite access per tenant

-- 1. Add the column
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS complyflow_enabled BOOLEAN DEFAULT false;

-- 2. Update existing 'enterprise' or 'premium' tenants to have it enabled by default
UPDATE public.tenants 
SET complyflow_enabled = true 
WHERE subscription_tier IN ('enterprise', 'premium');

-- 3. Document the change in the settings JSONB for redundancy (matching project pattern)
UPDATE tenants 
SET settings = jsonb_set(
    COALESCE(settings, '{}'::jsonb), 
    '{complyflow_enabled}', 
    'true'
)
WHERE complyflow_enabled = true;
