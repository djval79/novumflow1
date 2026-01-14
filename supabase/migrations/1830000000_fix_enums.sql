
-- Extension of enums to satisfy check constraints in later migrations
-- ALTER TYPE ... ADD VALUE cannot be run in a transaction block (DO block) in many cases,
-- but we'll run it as separate statements.

ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'starter';
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'premium';
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'free';
