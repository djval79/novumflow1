-- Create enum for proficiency levels
CREATE TYPE public.proficiency_level AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Digital Champion');

-- Create employee_digital_skills table
CREATE TABLE IF NOT EXISTS public.employee_digital_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    proficiency_level public.proficiency_level NOT NULL DEFAULT 'Beginner',
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.employee_digital_skills ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view skills for their tenant"
    ON public.employee_digital_skills
    FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_tenant_memberships 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admins and HR can manage skills"
    ON public.employee_digital_skills
    FOR ALL
    USING (tenant_id IN (
        SELECT tenant_id FROM public.user_tenant_memberships 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'hr_manager')
    ));

-- Create indexes
CREATE INDEX idx_digital_skills_employee ON public.employee_digital_skills(employee_id);
CREATE INDEX idx_digital_skills_tenant ON public.employee_digital_skills(tenant_id);
