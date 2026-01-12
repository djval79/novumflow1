
-- Force repair of user_tenant_memberships Foreign Key (v2)
-- We rename the constraint to avoid any caching or phantom issues.

DO $$
BEGIN
    -- 1. Drop the standard named constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_tenant_memberships_user_id_fkey') THEN
        ALTER TABLE public.user_tenant_memberships DROP CONSTRAINT user_tenant_memberships_user_id_fkey;
    END IF;

    -- 2. Drop the v2 constraint if it already exists (idempotency)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_tenant_memberships_user_id_fkey_v2') THEN
        ALTER TABLE public.user_tenant_memberships DROP CONSTRAINT user_tenant_memberships_user_id_fkey_v2;
    END IF;

    -- 3. Add the explicitly named constraint pointing to auth.users
    ALTER TABLE public.user_tenant_memberships
    ADD CONSTRAINT user_tenant_memberships_user_id_fkey_v2
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

END $$;
