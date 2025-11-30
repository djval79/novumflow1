-- Debug RPC to bypass REST schema cache
CREATE OR REPLACE FUNCTION debug_create_care_plan(
    p_tenant_id UUID,
    p_client_id UUID,
    p_summary TEXT,
    p_tasks JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    INSERT INTO care_plans (tenant_id, client_id, summary, tasks)
    VALUES (p_tenant_id, p_client_id, p_summary, p_tasks)
    ON CONFLICT (client_id) DO UPDATE
    SET summary = EXCLUDED.summary,
        tasks = EXCLUDED.tasks
    RETURNING to_jsonb(care_plans.*) INTO v_result;
    
    RETURN v_result;
END;
$$;
