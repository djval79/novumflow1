-- Create health_declarations table
CREATE TABLE IF NOT EXISTS public.health_declarations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    declaration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Under Review',
    document_path TEXT,
    notes TEXT,
    next_review_date DATE,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create supervision_records table
CREATE TABLE IF NOT EXISTS public.supervision_records (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    supervisor_id UUID REFERENCES public.employees(id),
    supervision_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL DEFAULT 'Formal',
    notes TEXT,
    outcomes TEXT,
    next_supervision_date DATE,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create appraisal_records table
CREATE TABLE IF NOT EXISTS public.appraisal_records (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    appraiser_id UUID REFERENCES public.employees(id),
    appraisal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    score INTEGER,
    summary TEXT,
    goals_set JSONB DEFAULT '[]'::jsonb,
    next_appraisal_date DATE,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS
ALTER TABLE public.health_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervision_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisal_records ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies (adjust as needed based on your tenant logic)
DROP POLICY IF EXISTS "Tenants can only see their own health declarations" ON public.health_declarations;
CREATE POLICY "Tenants can only see their own health declarations" ON public.health_declarations
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenants can only see their own supervision records" ON public.supervision_records;
CREATE POLICY "Tenants can only see their own supervision records" ON public.supervision_records
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenants can only see their own appraisal records" ON public.appraisal_records;
CREATE POLICY "Tenants can only see their own appraisal records" ON public.appraisal_records
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users_profiles WHERE id = auth.uid()));

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_health ON public.health_declarations;
CREATE TRIGGER set_updated_at_health BEFORE UPDATE ON public.health_declarations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_supervision ON public.supervision_records;
CREATE TRIGGER set_updated_at_supervision BEFORE UPDATE ON public.supervision_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_appraisal ON public.appraisal_records;
CREATE TRIGGER set_updated_at_appraisal BEFORE UPDATE ON public.appraisal_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
