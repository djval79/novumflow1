-- Force Schema Cache Refresh
-- Sometimes NOTIFY pgrst is not enough if no DDL changes were detected or if the listener isn't active.
-- We will force a DDL change.

ALTER TABLE care_plans ADD COLUMN IF NOT EXISTS _force_refresh TEXT;

NOTIFY pgrst, 'reload schema';

ALTER TABLE care_plans DROP COLUMN IF EXISTS _force_refresh;

NOTIFY pgrst, 'reload schema';
