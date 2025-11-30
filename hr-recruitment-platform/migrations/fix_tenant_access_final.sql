-- Fix Tenant Access and Permissions for Admin Users

DO $$
DECLARE
    v_owner_email text := 'mrsonirie@gmail.com';
    v_hr_email text := 'hr@ringsteadcare.com';
    v_owner_id uuid;
    v_hr_id uuid;
    v_tenant_id uuid;
BEGIN
    -- 1. Get User IDs
    SELECT id INTO v_owner_id FROM auth.users WHERE email = v_owner_email;
    SELECT id INTO v_hr_id FROM auth.users WHERE email = v_hr_email;

    -- 2. Ensure a Tenant Exists (Ringstead Care)
    -- Try to find existing tenant for owner, or create one
    SELECT id INTO v_tenant_id 
    FROM public.tenants 
    WHERE name = 'Ringstead Care' LIMIT 1;

    IF v_tenant_id IS NULL THEN
        INSERT INTO public.tenants (name, subdomain, slug, subscription_tier, subscription_status, features, settings)
        VALUES (
            'Ringstead Care', 
            'ringstead', 
            'ringstead', 
            'enterprise', 
            'active',
            '{"novumflow_enabled": true, "careflow_enabled": true, "ai_enabled": true}'::jsonb,
            '{"disabled_features": []}'::jsonb
        )
        RETURNING id INTO v_tenant_id;
    ELSE
        -- Update existing tenant to ensure features are enabled
        UPDATE public.tenants
        SET 
            subscription_tier = 'enterprise',
            subscription_status = 'active',
            features = '{"novumflow_enabled": true, "careflow_enabled": true, "ai_enabled": true}'::jsonb,
            settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{disabled_features}', '[]'::jsonb)
        WHERE id = v_tenant_id;
    END IF;

    -- 3. Grant Owner Access to mrsonirie@gmail.com
    IF v_owner_id IS NOT NULL THEN
        INSERT INTO public.user_tenant_memberships (user_id, tenant_id, role, is_active, permissions)
        VALUES (
            v_owner_id, 
            v_tenant_id, 
            'owner', 
            true, 
            '["admin_access", "manage_settings", "manage_billing", "manage_users"]'::jsonb
        )
        ON CONFLICT (user_id, tenant_id) 
        DO UPDATE SET 
            role = 'owner', 
            is_active = true,
            permissions = '["admin_access", "manage_settings", "manage_billing", "manage_users"]'::jsonb;
            
        -- Also ensure profile exists and is admin
        INSERT INTO public.users_profiles (user_id, email, full_name, role)
        VALUES (v_owner_id, v_owner_email, 'Mr Sonirie', 'Admin')
        ON CONFLICT (user_id) DO UPDATE SET role = 'Admin';
    END IF;

    -- 4. Grant Admin Access to hr@ringsteadcare.com
    IF v_hr_id IS NOT NULL THEN
        INSERT INTO public.user_tenant_memberships (user_id, tenant_id, role, is_active, permissions)
        VALUES (
            v_hr_id, 
            v_tenant_id, 
            'admin', 
            true, 
            '["admin_access", "manage_settings", "manage_users", "create_jobs", "manage_applications"]'::jsonb
        )
        ON CONFLICT (user_id, tenant_id) 
        DO UPDATE SET 
            role = 'admin', 
            is_active = true;
            
        -- Also ensure profile exists and is admin
        INSERT INTO public.users_profiles (user_id, email, full_name, role)
        VALUES (v_hr_id, v_hr_email, 'HR Admin', 'Admin')
        ON CONFLICT (user_id) DO UPDATE SET role = 'Admin';
    END IF;

END $$;
