-- ============================================
-- Phase 4: Shift Management & Rostering
-- ============================================

-- Note: We are using the existing 'visits' table for shifts/visits
-- to avoid duplication and maintain referential integrity with
-- medications, notes, etc.

-- 1. Create Staff Availability Table
CREATE TABLE IF NOT EXISTS staff_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- If true, this is a "Time Off" block. If false, it's "Preferred Hours".
    -- For MVP, we'll assume this table stores *Availability* (so is_unavailable = false by default).
    -- But let's keep the flag for flexibility.
    is_unavailable BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- RLS for Availability
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view availability in their tenant"
ON staff_availability FOR SELECT
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager', 'carer', 'nurse']));

CREATE POLICY "Admins/Managers can manage availability"
ON staff_availability FOR ALL
USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'manager']));

-- 2. Conflict Check RPC
-- Checks if a staff member is already assigned to a visit overlapping with the proposed time.
CREATE OR REPLACE FUNCTION check_visit_conflicts(
    p_staff_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_visit_id UUID DEFAULT NULL
)
RETURNS TABLE (
    visit_id UUID,
    visit_start TIME,
    visit_end TIME
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id as visit_id,
        start_time as visit_start,
        end_time as visit_end
    FROM visits
    WHERE staff_id = p_staff_id
      AND date = p_date
      AND status NOT IN ('Cancelled', 'Missed')
      AND (id != p_exclude_visit_id OR p_exclude_visit_id IS NULL)
      AND (
          (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
