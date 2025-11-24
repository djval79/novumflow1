-- Migration: Seed tenants and features for multi-tenant feature system
-- Run this after the schema migration (create_tenant_feature_system.sql)

-- Note: This seed file is now redundant since create_tenant_feature_system.sql
-- already inserts all tenants and features. You can skip running this file.

-- If you still want to run it, it will use ON CONFLICT to avoid duplicates.

-- Insert tenants (UUID generated automatically)
INSERT INTO tenants (name, slug, domain, subscription_tier)
VALUES
  ('Ringstead Care', 'ringstead-care', 'ringsteadcare.com', 'enterprise'),
  ('Welcome Care', 'welcome-care', 'welcomecare.com', 'basic'),
  ('Test Tenant 1', 'test-tenant-1', NULL, 'basic'),
  ('Test Tenant 2', 'test-tenant-2', NULL, 'basic'),
  ('Test Tenant 3', 'test-tenant-3', NULL, 'basic')
ON CONFLICT (slug) DO NOTHING;

-- Features are already inserted by create_tenant_feature_system.sql
-- Tenant feature assignments are also already done by create_tenant_feature_system.sql
