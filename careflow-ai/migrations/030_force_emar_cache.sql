-- Force Schema Cache Refresh for eMAR
ALTER TABLE medications ADD COLUMN IF NOT EXISTS _force_refresh TEXT;
ALTER TABLE medication_logs ADD COLUMN IF NOT EXISTS _force_refresh TEXT;

NOTIFY pgrst, 'reload schema';

ALTER TABLE medications DROP COLUMN IF EXISTS _force_refresh;
ALTER TABLE medication_logs DROP COLUMN IF EXISTS _force_refresh;

NOTIFY pgrst, 'reload schema';
