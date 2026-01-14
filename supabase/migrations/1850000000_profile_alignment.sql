
-- Profile Alignment
-- Ensures users_profiles has all columns required by various RLS policies.

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profiles' AND column_name = 'is_admin') THEN
            ALTER TABLE users_profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
            -- Sync is_admin with is_super_admin if it exists
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profiles' AND column_name = 'is_super_admin') THEN
                UPDATE users_profiles SET is_admin = is_super_admin;
            END IF;
        END IF;
    END IF;
END $$;
