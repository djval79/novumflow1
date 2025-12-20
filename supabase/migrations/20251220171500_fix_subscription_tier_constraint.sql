-- Fix tenants subscription_tier check constraint to include 'trial'
-- This ensures the TypeScript type and DB constraint are aligned

-- Drop old constraint
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_subscription_tier_check;

-- Add updated constraint with 'trial' included
ALTER TABLE tenants ADD CONSTRAINT tenants_subscription_tier_check 
    CHECK (subscription_tier IN ('trial', 'basic', 'professional', 'enterprise', 'starter', 'premium'));

-- Verify the fix
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'tenants_subscription_tier_check';
