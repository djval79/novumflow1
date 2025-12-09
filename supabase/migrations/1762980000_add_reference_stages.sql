-- Migration: add_reference_stages
-- Created at: 1762980000

DO $$
DECLARE
    wf_id UUID;
BEGIN
    -- Get the default workflow ID
    SELECT id INTO wf_id FROM recruitment_workflows WHERE is_default = true LIMIT 1;

    IF wf_id IS NOT NULL THEN
        -- Shift existing stages after 'Interview' (order 3) by +2 to make room
        UPDATE workflow_stages
        SET stage_order = stage_order + 2
        WHERE workflow_id = wf_id AND stage_order > 3;

        -- Insert Reference 1 at order 4
        INSERT INTO workflow_stages (workflow_id, name, stage_order, stage_type)
        VALUES (wf_id, 'Reference 1', 4, 'custom');

        -- Insert Reference 2 at order 5
        INSERT INTO workflow_stages (workflow_id, name, stage_order, stage_type)
        VALUES (wf_id, 'Reference 2', 5, 'custom');
    END IF;
END $$;
