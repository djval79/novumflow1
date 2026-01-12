
-- =====================================================================
-- Phase 2.1: Unified User Profiles
-- =====================================================================
-- This migration ensures that users_profiles is the single source of truth.
-- Updating a profile will propagate changes to all related employee/staff records.

-- 1. Function: Propagate Profile Changes
CREATE OR REPLACE FUNCTION public.propagate_user_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_first_name TEXT;
    v_last_name TEXT;
    v_name_parts TEXT[];
BEGIN
    -- 1. Split full_name into first/last for the employees table
    v_name_parts := string_to_array(NEW.full_name, ' ');
    v_first_name := v_name_parts[1];
    v_last_name := array_to_string(v_name_parts[2:], ' ');

    -- 2. Update NovumFlow Employees
    UPDATE public.employees
    SET 
        first_name = COALESCE(v_first_name, first_name),
        last_name = COALESCE(v_last_name, last_name),
        email = NEW.email,
        phone = NEW.phone,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    -- 3. Update CareFlow Staff
    UPDATE public.careflow_staff
    SET
        full_name = NEW.full_name,
        email = NEW.email,
        phone = NEW.phone,
        avatar_url = NEW.avatar_url,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger for Profile Sync
DROP TRIGGER IF EXISTS trigger_propagate_profile_changes ON public.users_profiles;
CREATE TRIGGER trigger_propagate_profile_changes
    AFTER UPDATE ON public.users_profiles
    FOR EACH ROW
    WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name OR 
          OLD.email IS DISTINCT FROM NEW.email OR 
          OLD.phone IS DISTINCT FROM NEW.phone OR 
          OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
    EXECUTE FUNCTION public.propagate_user_profile_changes();

-- 3. Backfill: Sync any existing profiles to employees/staff
DO $$
BEGIN
    -- This ensures existing data is consistent
    UPDATE public.employees e
    SET 
        first_name = COALESCE(split_part(p.full_name, ' ', 1), e.first_name),
        last_name = COALESCE(NULLIF(substring(p.full_name from ' .*'), ''), e.last_name),
        email = p.email,
        phone = p.phone
    FROM public.users_profiles p
    WHERE e.user_id = p.user_id;

    UPDATE public.careflow_staff s
    SET
        full_name = p.full_name,
        email = p.email,
        phone = p.phone,
        avatar_url = p.avatar_url
    FROM public.users_profiles p
    WHERE s.user_id = p.user_id;
END $$;
