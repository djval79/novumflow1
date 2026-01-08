-- Create a trigger function to notify of new demo requests
-- This uses the supabase_functions extension if available, or pg_net
-- For this implementation, we assume the user will deploy the Edge Function 'notify-demo-lead'

CREATE OR REPLACE FUNCTION public.on_demo_request_inserted()
RETURNS TRIGGER AS $$
DECLARE
  request_payload JSONB;
BEGIN
  request_payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'demo_requests',
    'record', row_to_json(NEW)
  );

  -- Call the Edge Function
  -- Note: In a production environment, you'd replace the URL with your actual project URL 
  -- or use the internal net.http_post if pg_net is enabled.
  -- For now, we set up the trigger but the actual 'HTTP call' usually requires 
  -- the Supabase Dashboard Webhook UI for reliability and secret management.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- However, a better way in pure SQL for Supabase is to use the 'net' extension:
-- CREATE TRIGGER tr_notify_demo_request
-- AFTER INSERT ON public.demo_requests
-- FOR EACH ROW
-- EXECUTE FUNCTION net.http_post(
--   'https://niikshfoecitimepiifo.supabase.co/functions/v1/notify-demo-lead',
--   '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}',
--   '{}', 
--   json_build_object('record', row_to_json(NEW))
-- );

-- Since I don't want to bake secrets into SQL, I'll provide the instructions 
-- to enable this via the Dashboard Webhook UI which is the recommended Supabase path.
