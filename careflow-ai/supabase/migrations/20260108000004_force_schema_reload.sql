-- Force PostgREST schema cache reload
-- This sends a NOTIFY to pgrst_reload channel which triggers cache refresh

NOTIFY pgrst, 'reload schema';

-- Also try the config reload
NOTIFY pgrst, 'reload config';
