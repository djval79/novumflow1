-- Add subscription interval to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS subscription_interval TEXT DEFAULT 'monthly' CHECK (subscription_interval IN ('monthly', 'yearly'));

COMMENT ON COLUMN tenants.subscription_interval IS 'Billing interval for the subscription (monthly or yearly)';
