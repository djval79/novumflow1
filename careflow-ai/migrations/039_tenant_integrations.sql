-- Create tenant_secrets table for sensitive data
CREATE TABLE IF NOT EXISTS public.tenant_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    secret_type TEXT NOT NULL CHECK (secret_type IN ('smtp_password', 'stripe_access_token', 'stripe_refresh_token')),
    secret_value TEXT NOT NULL, -- In a real prod env, use pgsodium. For now, rely on RLS.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, secret_type)
);

-- Enable RLS
ALTER TABLE public.tenant_secrets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_secrets
-- Only allow access via SECURITY DEFINER functions (deny direct access by default)
CREATE POLICY "deny_all_direct_access" ON public.tenant_secrets
    FOR ALL
    USING (false);

-- Function to save SMTP config securely
CREATE OR REPLACE FUNCTION public.save_tenant_smtp_config(
    p_host TEXT,
    p_port INTEGER,
    p_user TEXT,
    p_password TEXT, -- Optional, if null, don't update password
    p_from_email TEXT,
    p_tenant_id UUID DEFAULT NULL -- Optional, defaults to current user's tenant context if not provided
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_user_role TEXT;
BEGIN
    -- Determine tenant_id
    IF p_tenant_id IS NOT NULL THEN
        -- Verify user has access to this tenant as owner/admin
        IF NOT EXISTS (
            SELECT 1 FROM public.user_tenant_memberships
            WHERE user_id = auth.uid() 
            AND tenant_id = p_tenant_id 
            AND role IN ('owner', 'admin')
            AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Access denied';
        END IF;
        v_tenant_id := p_tenant_id;
    ELSE
        -- Use current tenant context (if set via set_current_tenant) or infer from membership
        -- For simplicity, let's require p_tenant_id or fetch single active membership
        SELECT tenant_id INTO v_tenant_id
        FROM public.user_tenant_memberships
        WHERE user_id = auth.uid() AND is_active = true
        LIMIT 1;
        
        IF v_tenant_id IS NULL THEN
             RAISE EXCEPTION 'No active tenant found';
        END IF;
    END IF;

    -- Update non-sensitive settings in tenants table
    UPDATE public.tenants
    SET settings = jsonb_set(
        jsonb_set(
            COALESCE(settings, '{}'::jsonb),
            '{email_settings}',
            jsonb_build_object(
                'provider', 'smtp',
                'host', p_host,
                'port', p_port,
                'user', p_user,
                'from_email', p_from_email
            )
        ),
        '{updated_at}',
        to_jsonb(NOW())
    )
    WHERE id = v_tenant_id;

    -- Update password in tenant_secrets if provided
    IF p_password IS NOT NULL AND p_password != '' THEN
        INSERT INTO public.tenant_secrets (tenant_id, secret_type, secret_value)
        VALUES (v_tenant_id, 'smtp_password', p_password)
        ON CONFLICT (tenant_id, secret_type)
        DO UPDATE SET 
            secret_value = EXCLUDED.secret_value,
            updated_at = NOW();
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to get SMTP config (excluding password)
CREATE OR REPLACE FUNCTION public.get_tenant_smtp_config(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings JSONB;
    v_has_password BOOLEAN;
BEGIN
    -- Verify access
    IF NOT EXISTS (
        SELECT 1 FROM public.user_tenant_memberships
        WHERE user_id = auth.uid() 
        AND tenant_id = p_tenant_id 
        AND role IN ('owner', 'admin')
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Get settings
    SELECT settings->'email_settings' INTO v_settings
    FROM public.tenants
    WHERE id = p_tenant_id;

    -- Check if password exists
    SELECT EXISTS (
        SELECT 1 FROM public.tenant_secrets
        WHERE tenant_id = p_tenant_id AND secret_type = 'smtp_password'
    ) INTO v_has_password;

    -- Return combined result
    RETURN jsonb_build_object(
        'config', v_settings,
        'has_password', v_has_password
    );
END;
$$;

-- Function to save Stripe config (mock for now)
CREATE OR REPLACE FUNCTION public.save_tenant_stripe_config(
    p_account_id TEXT,
    p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify access
    IF NOT EXISTS (
        SELECT 1 FROM public.user_tenant_memberships
        WHERE user_id = auth.uid() 
        AND tenant_id = p_tenant_id 
        AND role IN ('owner', 'admin')
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Update settings
    UPDATE public.tenants
    SET settings = jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{payment_gateway}',
        jsonb_build_object(
            'provider', 'stripe',
            'account_id', p_account_id,
            'is_enabled', true
        )
    )
    WHERE id = p_tenant_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
