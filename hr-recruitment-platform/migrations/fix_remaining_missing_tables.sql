-- ============================================================================
-- FIX REMAINING MISSING TABLES
-- ============================================================================

-- 1. Communication Tables
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    conversation_type TEXT DEFAULT 'direct' CHECK (conversation_type IN ('direct', 'group')),
    is_archived BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID,
    role_in_conversation TEXT DEFAULT 'member',
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID,
    content TEXT NOT NULL,
    attachment_url TEXT,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Announcement Views
CREATE TABLE IF NOT EXISTS announcement_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    UNIQUE(announcement_id, user_id)
);

-- 3. HR Meta Tables
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    head_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL UNIQUE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    description TEXT,
    salary_range_min NUMERIC,
    salary_range_max NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Compliance Records (Needed for CareFlow Sync)
CREATE TABLE IF NOT EXISTS compliance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    tenant_id UUID,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    issue_date DATE,
    expiry_date DATE,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;

-- 6. Create Policies (Simple authenticated access for now)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "auth_all_conversations" ON conversations;
    CREATE POLICY "auth_all_conversations" ON conversations FOR ALL TO authenticated USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "auth_all_participants" ON message_participants;
    CREATE POLICY "auth_all_participants" ON message_participants FOR ALL TO authenticated USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "auth_all_messages" ON messages;
    CREATE POLICY "auth_all_messages" ON messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "auth_all_announcement_views" ON announcement_views;
    CREATE POLICY "auth_all_announcement_views" ON announcement_views FOR ALL TO authenticated USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "auth_all_departments" ON departments;
    CREATE POLICY "auth_all_departments" ON departments FOR ALL TO authenticated USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "auth_all_positions" ON positions;
    CREATE POLICY "auth_all_positions" ON positions FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "auth_all_compliance_records" ON compliance_records;
    CREATE POLICY "auth_all_compliance_records" ON compliance_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;

-- 7. Grant Permissions to service_role
GRANT ALL ON conversations TO service_role;
GRANT ALL ON message_participants TO service_role;
GRANT ALL ON messages TO service_role;
GRANT ALL ON announcement_views TO service_role;
GRANT ALL ON departments TO service_role;
GRANT ALL ON positions TO service_role;
GRANT ALL ON compliance_records TO service_role;

-- 7. Insert Initial Data
INSERT INTO departments (name, description) VALUES 
('HR', 'Human Resources Department'),
('Clinical', 'Clinical and Care Delivery'),
('Management', 'Executive and Operations Management'),
('Support', 'Support and Logistics')
ON CONFLICT (name) DO NOTHING;

INSERT INTO positions (title, description) VALUES 
('Care Worker', 'Frontline care delivery specialist'),
('Senior Care Worker', 'Experienced care leader'),
('Care Manager', 'Operations and compliance lead'),
('HR Specialist', 'Recruitment and workforce management')
ON CONFLICT (title) DO NOTHING;

-- VERIFICATION
SELECT '✅ Success! Remaining missing tables created.' as status;
