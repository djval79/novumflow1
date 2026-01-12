-- FORCE REPAIR of user_tenant_memberships Foreign Key
-- It is suspected that the table exists with a wrong FK (maybe pointing to public.users or similar)
-- We need to ensure it points to auth.users

DO $$
BEGIN
    -- 1. Drop the constraint if it exists (by name)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_tenant_memberships_user_id_fkey') THEN
        ALTER TABLE public.user_tenant_memberships DROP CONSTRAINT user_tenant_memberships_user_id_fkey;
    END IF;

    -- 2. Clean up any bad data that might violate the new key (orphaned rows)
    --    (Optional: Delete rows where user_id not in auth.users)
    --    DELETE FROM public.user_tenant_memberships WHERE user_id NOT IN (SELECT id FROM auth.users);

    -- 3. Add the correct constraint
    ALTER TABLE public.user_tenant_memberships
    ADD CONSTRAINT user_tenant_memberships_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

END $$;
