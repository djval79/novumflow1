-- ============================================================================
-- ADD LETTER MANAGEMENT AND REMAINING SECURITY TABLES
-- ============================================================================

-- 1. LETTER TEMPLATES
CREATE TABLE IF NOT EXISTS letter_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    category TEXT,
    subject TEXT,
    content TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GENERATED LETTERS
CREATE TABLE IF NOT EXISTS generated_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES letter_templates(id) ON DELETE SET NULL,
    employee_id UUID, -- References employees(id)
    letter_type TEXT NOT NULL,
    subject TEXT,
    content TEXT,
    pdf_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'rejected')),
    generated_by UUID,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- 3. LOGIN ATTEMPTS (For Security Dashboard)
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    attempt_status TEXT NOT NULL CHECK (attempt_status IN ('success', 'failed')),
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACCOUNT LOCKOUTS (For Security Dashboard)
CREATE TABLE IF NOT EXISTS account_lockouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email TEXT NOT NULL,
    unlock_token TEXT,
    is_active BOOLEAN DEFAULT true,
    locked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_letter_templates_type ON letter_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_generated_letters_employee ON generated_letters(employee_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_active ON account_lockouts(is_active) WHERE is_active = true;

-- ENABLE RLS
ALTER TABLE letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES (Simple authenticated access for now, similar to other tables)
CREATE POLICY "auth_all_letter_templates" ON letter_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_generated_letters" ON generated_letters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_login_attempts" ON login_attempts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_account_lockouts" ON account_lockouts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- GRANT PERMISSIONS
GRANT ALL ON letter_templates TO service_role;
GRANT ALL ON generated_letters TO service_role;
GRANT ALL ON login_attempts TO service_role;
GRANT ALL ON account_lockouts TO service_role;

-- VERIFICATION
SELECT '✅ Success! Letter management and security tables created.' as status;
