CREATE TABLE failed_syncs (
    id bigserial PRIMARY KEY,
    payload jsonb NOT NULL,
    error_message text,
    retries integer DEFAULT 0,
    status text DEFAULT 'pending_retry',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Function to update the 'updated_at' timestamp on row modification
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update 'updated_at'
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON failed_syncs
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
