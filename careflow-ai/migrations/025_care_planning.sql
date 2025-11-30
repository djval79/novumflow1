-- ============================================
-- Phase 8: Care Planning (FIXED)
-- ============================================

-- 1. Create Care Plans Table
CREATE TABLE IF NOT EXISTS care_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    summary TEXT,
    tasks JSONB DEFAULT '[]', -- Array of { id, label }
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(client_id) -- One active care plan per client for MVP
);

-- Enable RLS
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policy (Drop first to avoid "already exists" error)
DROP POLICY IF EXISTS "Users can access care plans in their tenant" ON care_plans;

CREATE POLICY "Users can access care plans in their tenant"
ON care_plans FOR ALL USING (user_has_tenant_access(tenant_id));

-- Trigger for updated_at (Drop first to avoid error)
DROP TRIGGER IF EXISTS update_care_plans_updated_at ON care_plans;

CREATE TRIGGER update_care_plans_updated_at 
BEFORE UPDATE ON care_plans 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 2. UPDATE RPC: Generate Visits from Schedule
-- Now copies tasks from Care Plan if available
CREATE OR REPLACE FUNCTION generate_visits_from_schedule(
    p_schedule_id UUID,
    p_generation_end_date DATE
)
RETURNS INTEGER -- Returns number of visits created
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_schedule RECORD;
    v_current_date DATE;
    v_count INTEGER := 0;
    v_dow INTEGER;
    v_care_plan_tasks JSONB := '[]';
BEGIN
    -- Get Schedule
    SELECT * INTO v_schedule FROM recurring_schedules WHERE id = p_schedule_id;
    
    IF v_schedule IS NULL THEN
        RAISE EXCEPTION 'Schedule not found';
    END IF;

    -- Get Client's Care Plan Tasks (if any)
    SELECT tasks INTO v_care_plan_tasks 
    FROM care_plans 
    WHERE client_id = v_schedule.client_id 
    LIMIT 1;
    
    -- Default to empty array if null
    IF v_care_plan_tasks IS NULL THEN
        v_care_plan_tasks := '[]';
    END IF;

    v_current_date := v_schedule.start_date;
    
    -- Loop until end date
    WHILE v_current_date <= p_generation_end_date LOOP
        
        -- Check if current date is within schedule's end date (if set)
        IF v_schedule.end_date IS NOT NULL AND v_current_date > v_schedule.end_date THEN
            EXIT;
        END IF;

        -- Check Day of Week (1=Mon, 7=Sun)
        v_dow := EXTRACT(ISODOW FROM v_current_date);
        
        IF v_dow = ANY(v_schedule.days_of_week) THEN
            -- Attempt Insert
            -- Check for duplicates using visit_date
            IF NOT EXISTS (
                SELECT 1 FROM visits 
                WHERE client_id = v_schedule.client_id 
                AND visit_date = v_current_date 
                AND start_time = v_schedule.start_time
            ) THEN
                INSERT INTO visits (
                    tenant_id,
                    client_id,
                    staff_id,
                    visit_date,
                    start_time,
                    end_time,
                    visit_type,
                    status,
                    tasks -- Populate tasks from Care Plan
                ) VALUES (
                    v_schedule.tenant_id,
                    v_schedule.client_id,
                    v_schedule.staff_id,
                    v_current_date,
                    v_schedule.start_time,
                    v_schedule.end_time,
                    v_schedule.visit_type,
                    'Scheduled',
                    v_care_plan_tasks
                );
                v_count := v_count + 1;
            END IF;
        END IF;

        -- Increment Date
        v_current_date := v_current_date + 1;
    END LOOP;

    RETURN v_count;
END;
$$;
