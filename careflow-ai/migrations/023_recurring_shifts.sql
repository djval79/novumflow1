-- ============================================
-- Phase 6: Advanced Rostering - Recurring Shifts (FIX)
-- ============================================

-- Fix the RPC to use 'visit_date' instead of 'date'
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
BEGIN
    -- Get Schedule
    SELECT * INTO v_schedule FROM recurring_schedules WHERE id = p_schedule_id;
    
    IF v_schedule IS NULL THEN
        RAISE EXCEPTION 'Schedule not found';
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
                    visit_date, -- FIXED: Was 'date'
                    start_time,
                    end_time,
                    visit_type,
                    status
                ) VALUES (
                    v_schedule.tenant_id,
                    v_schedule.client_id,
                    v_schedule.staff_id,
                    v_current_date,
                    v_schedule.start_time,
                    v_schedule.end_time,
                    v_schedule.visit_type,
                    'Scheduled'
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
