-- =================================================================
-- COMPREHENSIVE SETUP VERIFICATION & FIX
-- Run this to ensure all QA prerequisites are met
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

-- 3. Create policy if not exists
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

-- 4. Seed role mappings (comprehensive list)
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

-- 5. Grant permissions
GRANT SELECT ON public.role_mappings TO authenticated;
GRANT SELECT ON public.role_mappings TO service_role;

-- 6. Create documents bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    true,
    52428800, -- 50MB
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

-- 7. Verification output
DO $$
DECLARE
    v_role_count INT;
    v_bucket_exists BOOLEAN;
BEGIN
    -- Check role mappings
    SELECT COUNT(*) INTO v_role_count FROM role_mappings;
    RAISE NOTICE '✅ Role mappings count: %', v_role_count;
    
    -- Check bucket
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'documents') INTO v_bucket_exists;
    IF v_bucket_exists THEN
        RAISE NOTICE '✅ Documents bucket exists';
    ELSE
        RAISE NOTICE '❌ Documents bucket missing';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Setup verification complete!';
END $$;
