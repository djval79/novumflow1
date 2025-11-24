-- Migration: Create tenant_api_keys table for per-tenant API keys
-- Run after create_tenant_feature_system.sql

CREATE TABLE IF NOT EXISTS tenant_api_keys (
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (tenant_id, service_name)
);
