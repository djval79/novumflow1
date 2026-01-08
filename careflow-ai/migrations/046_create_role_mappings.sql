-- =================================================================
-- Create Role Mappings Table
-- =================================================================
-- Maps roles between NovumFlow (HR) and CareFlow (Operations)
-- =================================================================

CREATE TABLE IF NOT EXISTS public.role_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novumflow_role TEXT NOT NULL UNIQUE,
    careflow_role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.role_mappings ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all authenticated users"
ON public.role_mappings FOR SELECT
TO authenticated
USING (true);

-- Seed Default Mappings
INSERT INTO public.role_mappings (novumflow_role, careflow_role) VALUES
('Recruiter', 'Manager'),
('HR Manager', 'Admin'),
('Care Worker', 'Carer'),
('Senior Care Worker', 'Senior Carer'),
('Nurse', 'Nurse'),
('Admin', 'Super Admin')
ON CONFLICT (novumflow_role) DO UPDATE 
SET careflow_role = EXCLUDED.careflow_role;

-- Grant permissions
GRANT SELECT ON public.role_mappings TO authenticated;
GRANT SELECT ON public.role_mappings TO service_role;
