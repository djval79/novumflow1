-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add tenant_id if it doesn't exist (in case table already existed without it)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_templates' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.email_templates 
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant_id ON public.email_templates(tenant_id);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own tenant email templates" ON public.email_templates;
CREATE POLICY "Users can view own tenant email templates" ON public.email_templates
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create email templates for own tenant" ON public.email_templates;
CREATE POLICY "Users can create email templates for own tenant" ON public.email_templates
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own tenant email templates" ON public.email_templates;
CREATE POLICY "Users can update own tenant email templates" ON public.email_templates
    FOR UPDATE TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own tenant email templates" ON public.email_templates;
CREATE POLICY "Users can delete own tenant email templates" ON public.email_templates
    FOR DELETE TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profiles 
            WHERE user_id = auth.uid()
        )
    );
