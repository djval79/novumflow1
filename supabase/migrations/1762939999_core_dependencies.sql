
-- Core Dependencies Migration
-- This file provides tables and types used across multiple modules (Recruitment, Compliance, CareFlow)
-- to satisfy foreign key constraints during deployment.

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
        CREATE TYPE subscription_tier AS ENUM ('trial', 'basic', 'professional', 'enterprise');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('active', 'trial', 'cancelled', 'suspended', 'expired');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_authority') THEN
        CREATE TYPE compliance_authority AS ENUM ('HOME_OFFICE', 'CQC', 'BOTH', 'INTERNAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_stage') THEN
        CREATE TYPE compliance_stage AS ENUM ('APPLICATION', 'PRE_EMPLOYMENT', 'ONBOARDING', 'ONGOING', 'OFFBOARDING');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM ('PENDING', 'UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'EXPIRING_SOON', 'NOT_APPLICABLE');
    END IF;
END $$;

-- 3. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    subdomain TEXT UNIQUE,
    subscription_tier subscription_tier DEFAULT 'trial',
    subscription_status subscription_status DEFAULT 'trial',
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Compliance Document Types (Prerequisite for security lints)
CREATE TABLE IF NOT EXISTS compliance_document_types (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    authority compliance_authority NOT NULL,
    stages compliance_stage[] NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Compliance Folders (Prerequisite for security lints)
CREATE TABLE IF NOT EXISTS compliance_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    authority compliance_authority NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Other Missing Tables referenced in lints
CREATE TABLE IF NOT EXISTS compliance_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS failed_syncs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_approval_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Ensure users_profiles has required columns for subsequent migrations
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profiles' AND column_name = 'is_super_admin') THEN
            ALTER TABLE users_profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profiles' AND column_name = 'tenant_id') THEN
            ALTER TABLE users_profiles ADD COLUMN tenant_id UUID;
        END IF;
    END IF;
END $$;

