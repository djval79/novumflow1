-- =====================================================
-- NOVUMFLOW MIGRATION SCRIPT FOR NEW SUPABASE PROJECT
-- =====================================================
-- Run this SQL in your new Supabase project to set up all tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER PROFILES TABLE
-- =====================================================
CREATE TABLE users_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('Admin', 'HR Manager', 'Recruiter', 'Employee')),
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  department TEXT,
  position TEXT,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- JOB POSTINGS TABLE
-- =====================================================
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT,
  employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary')),
  salary_range TEXT,
  description TEXT,
  requirements TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'filled', 'draft')),
  deadline DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- APPLICATIONS TABLE
-- =====================================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_first_name TEXT NOT NULL,
  applicant_last_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  years_of_experience INTEGER DEFAULT 0,
  status TEXT DEFAULT 'applied' CHECK (status IN (
    'applied', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 
    'offer_extended', 'ref_1_pending', 'ref_1_completed', 'ref_2_pending', 
    'ref_2_completed', 'dbs_pending', 'dbs_completed', 'hired', 'rejected'
  )),
  score INTEGER,
  notes TEXT,
  how_heard_about_job TEXT,
  certificate_urls JSONB DEFAULT '[]',
  submitted_by UUID REFERENCES auth.users(id),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EMPLOYEES TABLE
-- =====================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  department TEXT,
  position TEXT,
  employment_type TEXT DEFAULT 'full_time',
  date_of_birth DATE,
  date_hired DATE,
  salary NUMERIC,
  salary_grade TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'on_leave')),
  manager_id UUID REFERENCES employees(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INTERVIEWS TABLE
-- =====================================================
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  interview_type TEXT DEFAULT 'phone_screening' CHECK (interview_type IN (
    'phone_screening', 'video_call', 'in_person', 'technical', 'final'
  )),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration INTEGER DEFAULT 60, -- minutes
  location TEXT,
  interviewer_notes TEXT,
  candidate_feedback TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'
  )),
  score INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LEAVE REQUESTS TABLE
-- =====================================================
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT DEFAULT 'annual' CHECK (leave_type IN (
    'annual', 'sick', 'maternity', 'paternity', 'emergency', 'unpaid'
  )),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LETTER TEMPLATES TABLE
-- =====================================================
CREATE TABLE letter_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'offer_letter', 'rejection_letter', 'reference_request', 'general', 'termination'
  )),
  subject TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GENERATED LETTERS TABLE
-- =====================================================
CREATE TABLE generated_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES letter_templates(id),
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'delivered')),
  file_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ANNOUNCEMENTS TABLE (Notice Board)
-- =====================================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'general', 'urgent', 'job_related', 'policy_updates', 'compliance_alerts'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  target_audience JSONB DEFAULT '["all"]',
  attachments JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DOCUMENT UPLOADS TABLE
-- =====================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  tags TEXT[],
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STORAGE BUCKETS (Run these in Supabase Dashboard > Storage)
-- =====================================================
-- You'll need to create these buckets manually in your Supabase dashboard:
-- 1. applicant-cvs (for CV and certificate uploads)
-- 2. employee-documents (for employee files)
-- 3. generated-letters (for letter PDFs)
-- 4. company-assets (for company files)
-- 5. announcement-attachments (for notice board files)

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Basic policies for authenticated users (you can make these more restrictive)
CREATE POLICY "Users can view their own profile" ON users_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON users_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Admin and HR can see all job postings
CREATE POLICY "Anyone can view active job postings" ON job_postings FOR SELECT USING (status = 'active');
CREATE POLICY "Authenticated users can manage job postings" ON job_postings FOR ALL USING (auth.role() = 'authenticated');

-- Similar policies for other tables
CREATE POLICY "Authenticated users can manage applications" ON applications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage employees" ON employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage interviews" ON interviews FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage leave requests" ON leave_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage templates" ON letter_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage letters" ON generated_letters FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Anyone can view announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage announcements" ON announcements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view audit logs" ON audit_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage documents" ON documents FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_users_profiles_user_id ON users_profiles(user_id);
CREATE INDEX idx_applications_job_posting_id ON applications(job_posting_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_interviews_application_id ON interviews(application_id);
CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample job postings
INSERT INTO job_postings (job_title, department, location, employment_type, description, status) VALUES
('Senior Developer', 'Engineering', 'London', 'full_time', 'We are looking for a senior developer to join our team.', 'active'),
('HR Manager', 'Human Resources', 'Remote', 'full_time', 'Lead our HR initiatives and team development.', 'active'),
('Marketing Specialist', 'Marketing', 'Manchester', 'full_time', 'Drive our marketing campaigns and brand awareness.', 'active');

-- Insert sample letter templates
INSERT INTO letter_templates (template_name, category, subject, content) VALUES
('Welcome Letter', 'general', 'Welcome to {{company_name}}!', 'Dear {{employee_name}}, Welcome to our team! We are excited to have you join us.'),
('Offer Letter', 'offer_letter', 'Job Offer - {{position}}', 'Dear {{candidate_name}}, We are pleased to offer you the position of {{position}} at {{company_name}}.'),
('Interview Invitation', 'general', 'Interview Invitation - {{position}}', 'Dear {{candidate_name}}, We would like to invite you for an interview for the {{position}} role.');

COMMIT;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Your NOVUMFLOW database is now ready!
-- 
-- Next steps:
-- 1. Run this script in your Supabase SQL editor
-- 2. Create the storage buckets mentioned above
-- 3. Deploy your updated application
-- 4. Create your first admin user account
-- =====================================================