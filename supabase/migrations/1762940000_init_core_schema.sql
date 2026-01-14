-- Init Core Schema
-- Creates base tables that are missing from other migrations
-- Timestamp is set early (1762940000) to ensure this runs before auth_security_tables (1762948844)

-- 1. users_profiles
CREATE TABLE IF NOT EXISTS users_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE, -- Added UNIQUE constraint
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin',
    'hr_manager',
    'recruiter',
    'employee')),
    phone VARCHAR(50),
    avatar_url TEXT,
    department VARCHAR(100),
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_super_admin BOOLEAN DEFAULT false, -- Added for enterprise/multi-tenant
    tenant_id UUID,                     -- Added for multi-tenant
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. employees
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_profiles(user_id) ON DELETE SET NULL, -- Improved reference
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    date_hired DATE NOT NULL,
    employment_type VARCHAR(50) CHECK (employment_type IN ('full_time',
    'part_time',
    'contract',
    'temporary')),
    department VARCHAR(100),
    position VARCHAR(100),
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL, -- Self reference (standardized)
    salary_grade VARCHAR(50),
    visa_type VARCHAR(100),
    visa_expiry_date DATE,
    right_to_work_verified BOOLEAN DEFAULT false,
    right_to_work_expiry DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active',
    'on_leave',
    'suspended',
    'terminated')),
    termination_date DATE,
    termination_reason TEXT,
    created_by UUID NOT NULL, -- Could reference users_profiles(user_id) but let's keep it loose for now
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure manager_id exists if table already existed (defensive)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id UUID;


-- 3. recruitment_workflows
CREATE TABLE IF NOT EXISTS recruitment_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name VARCHAR(255) NOT NULL,
    job_posting_id UUID,
    stages TEXT NOT NULL,
    default_stages TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. job_postings
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_title VARCHAR(255) NOT NULL,
    job_code VARCHAR(50) UNIQUE,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    employment_type VARCHAR(50) CHECK (employment_type IN ('full_time',
    'part_time',
    'contract',
    'temporary',
    'internship')),
    salary_range_min DECIMAL(12,2),
    salary_range_max DECIMAL(12,2),
    salary_currency VARCHAR(10) DEFAULT 'USD',
    job_description TEXT NOT NULL,
    responsibilities TEXT,
    requirements TEXT,
    qualifications TEXT,
    benefits TEXT,
    application_deadline DATE,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft',
    'published',
    'closed',
    'cancelled')),
    published_at TIMESTAMP,
    closed_at TIMESTAMP,
    positions_available INTEGER DEFAULT 1,
    positions_filled INTEGER DEFAULT 0,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. applications
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE, -- Verified reference
    applicant_first_name VARCHAR(100) NOT NULL,
    applicant_last_name VARCHAR(100) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(50),
    cv_url TEXT NOT NULL,
    cover_letter TEXT,
    portfolio_url TEXT,
    linkedin_url TEXT,
    current_location VARCHAR(255),
    desired_salary DECIMAL(12,2),
    notice_period VARCHAR(100),
    status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied',
    'screening',
    'shortlisted',
    'interview_scheduled',
    'interviewed',
    'offer_extended',
    'offer_accepted',
    'offer_rejected',
    'hired',
    'rejected',
    'withdrawn')),
    pipeline_stage VARCHAR(100) DEFAULT 'new_application',
    score INTEGER CHECK (score >= 0 AND score <= 100),
    notes TEXT,
    source VARCHAR(100),
    applied_at TIMESTAMP DEFAULT NOW(),
    last_updated_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. interviews
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE, -- Verified reference
    interview_type VARCHAR(50) CHECK (interview_type IN ('phone_screening',
    'video',
    'in_person',
    'technical',
    'final')),
    scheduled_date TIMESTAMP NOT NULL,
    duration INTEGER DEFAULT 60,
    location TEXT,
    meeting_link TEXT,
    interviewer_ids TEXT,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled',
    'completed',
    'cancelled',
    'rescheduled',
    'no_show')),
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    recommendation VARCHAR(50) CHECK (recommendation IN ('strong_hire',
    'hire',
    'maybe',
    'no_hire')),
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. workflow_stages (Inferred from 1762980000 migration)
CREATE TABLE IF NOT EXISTS workflow_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES recruitment_workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    stage_order INTEGER NOT NULL,
    stage_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Verify creation
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
