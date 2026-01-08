-- =================================================================
-- COMPREHENSIVE SETUP & SYNC ACTIVATION
-- =================================================================

-- 1. Ensure role_mappings table exists
CREATE TABLE IF NOT EXISTS public.role_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novumflow_role TEXT NOT NULL UNIQUE,
    careflow_role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on role_mappings
ALTER TABLE public.role_mappings ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for role_mappings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'role_mappings' 
        AND policyname = 'Allow read access to all authenticated users'
    ) THEN
        CREATE POLICY "Allow read access to all authenticated users"
        ON public.role_mappings FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;

-- 4. Seed role mappings
INSERT INTO public.role_mappings (novumflow_role, careflow_role) VALUES
    ('Recruiter', 'admin'),
    ('HR Manager', 'admin'),
    ('HR Assistant', 'manager'),
    ('Care Manager', 'manager'),
    ('Senior Care Worker', 'senior_carer'),
    ('Care Worker', 'carer'),
    ('Nurse', 'nurse'),
    ('Administrator', 'admin'),
    ('Support Worker', 'carer'),
    ('Admin', 'admin'),
    ('Manager', 'manager')
ON CONFLICT (novumflow_role) DO UPDATE 
SET careflow_role = EXCLUDED.careflow_role,
    updated_at = NOW();

-- 5. Grant permissions on role_mappings
GRANT SELECT ON public.role_mappings TO authenticated;
GRANT SELECT ON public.role_mappings TO service_role;

-- 6. Create documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    true,
    52428800,
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ]
)
ON CONFLICT (id) DO UPDATE
SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 7. Activate Employee Sync Trigger (with Service Role Key)
CREATE EXTENSION IF NOT EXISTS "pg_net";

CREATE OR REPLACE FUNCTION sync_employee_to_careflow()
RETURNS TRIGGER AS $$
DECLARE
    v_project_url TEXT;
    v_service_key TEXT;
BEGIN
    -- Only sync if status changed to 'active' (Hired)
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        v_project_url := 'https://niikshfoecitimepiifo.supabase.co/functions/v1/sync-to-careflow';
        v_service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA1MjIxNSwiZXhwIjoyMDc4NjI4MjE1fQ.sPu18Bb90PKUL_rTDLK6MPvgpS1FfduWq4H0xoNWlA8';
        
        PERFORM net.http_post(
            url => v_project_url,
            headers => jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_key
            ),
            body => jsonb_build_object(
                'employee_id', NEW.id,
                'tenant_id', NEW.tenant_id,
                'action', 'sync',
                'include_compliance', true
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_employee_hired_sync ON employees;
CREATE TRIGGER trg_employee_hired_sync
AFTER INSERT OR UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION sync_employee_to_careflow();
