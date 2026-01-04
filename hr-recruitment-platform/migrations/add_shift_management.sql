-- Migration: Staff Rota & Shift Management
-- For scheduling staff across shifts, locations, and time periods

-- Shift Templates (reusable shift patterns)
CREATE TABLE IF NOT EXISTS shift_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL, -- e.g., 'Morning Shift', 'Night Shift', 'Long Day'
    code TEXT, -- e.g., 'AM', 'PM', 'ND', 'LD'
    
    start_time TIME NOT NULL, -- e.g., '07:00'
    end_time TIME NOT NULL, -- e.g., '15:00'
    break_duration_minutes INTEGER DEFAULT 30,
    
    -- Display
    color TEXT DEFAULT '#6366f1', -- Hex color for visual display
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Locations (work sites)
CREATE TABLE IF NOT EXISTS work_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL, -- e.g., 'Main Hospital', 'Care Home A'
    address TEXT,
    phone TEXT,
    
    -- Coverage requirements
    min_staff_per_shift INTEGER DEFAULT 1,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rotas (weekly schedules)
CREATE TABLE IF NOT EXISTS rotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL, -- e.g., 'Week 1 - January 2024'
    
    -- Week boundaries
    week_start_date DATE NOT NULL, -- Always a Monday
    week_end_date DATE NOT NULL, -- Always a Sunday
    
    location_id UUID REFERENCES work_locations(id) ON DELETE SET NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES auth.users(id),
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shift Assignments (individual scheduled shifts)
CREATE TABLE IF NOT EXISTS shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rota_id UUID NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
    
    -- Who
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- What shift
    shift_template_id UUID REFERENCES shift_templates(id) ON DELETE SET NULL,
    
    -- When
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INTEGER DEFAULT 30,
    
    -- Where
    location_id UUID REFERENCES work_locations(id) ON DELETE SET NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'no_show', 'cancelled'
    
    -- Actual times (for attendance)
    actual_start TIME,
    actual_end TIME,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff Availability
CREATE TABLE IF NOT EXISTS staff_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Recurring availability
    day_of_week INTEGER, -- 0=Sunday, 1=Monday, etc. NULL for specific date
    specific_date DATE, -- For one-off availability
    
    -- Available times
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    start_time TIME, -- NULL means all day
    end_time TIME,
    
    -- Preferences
    preference TEXT DEFAULT 'available', -- 'available', 'preferred', 'unavailable', 'holiday'
    
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Either day_of_week or specific_date must be set
    CONSTRAINT chk_availability_day CHECK (
        (day_of_week IS NOT NULL AND specific_date IS NULL) OR
        (day_of_week IS NULL AND specific_date IS NOT NULL)
    )
);

-- Shift Swap Requests
CREATE TABLE IF NOT EXISTS shift_swap_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Original assignment
    original_assignment_id UUID NOT NULL REFERENCES shift_assignments(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Swap with (optional - can be open request)
    swap_with_assignment_id UUID REFERENCES shift_assignments(id) ON DELETE SET NULL,
    swap_with_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    
    -- Approval
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shift_templates_tenant ON shift_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_locations_tenant ON work_locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rotas_tenant ON rotas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rotas_dates ON rotas(week_start_date, week_end_date);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_rota ON shift_assignments(rota_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_employee ON shift_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_date ON shift_assignments(shift_date);
CREATE INDEX IF NOT EXISTS idx_staff_availability_employee ON staff_availability(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_requester ON shift_swap_requests(requester_id);

-- RLS
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenant users can view shift templates"
ON shift_templates FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage shift templates"
ON shift_templates FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can view work locations"
ON work_locations FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage work locations"
ON work_locations FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can view rotas"
ON rotas FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage rotas"
ON rotas FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can view shift assignments"
ON shift_assignments FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage shift assignments"
ON shift_assignments FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can view availability"
ON staff_availability FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage availability"
ON staff_availability FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can view swap requests"
ON shift_swap_requests FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant users can manage swap requests"
ON shift_swap_requests FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users_profiles WHERE id = auth.uid()));

-- Insert default shift templates
INSERT INTO shift_templates (tenant_id, name, code, start_time, end_time, break_duration_minutes, color)
SELECT 
    t.id,
    template.name,
    template.code,
    template.start_time::TIME,
    template.end_time::TIME,
    template.break_minutes,
    template.color
FROM tenants t
CROSS JOIN (VALUES
    ('Early Shift', 'ES', '06:00', '14:00', 30, '#22c55e'),
    ('Day Shift', 'DS', '08:00', '16:00', 30, '#3b82f6'),
    ('Late Shift', 'LS', '14:00', '22:00', 30, '#f59e0b'),
    ('Night Shift', 'NS', '22:00', '06:00', 30, '#6366f1'),
    ('Long Day', 'LD', '07:00', '19:30', 60, '#ec4899')
) AS template(name, code, start_time, end_time, break_minutes, color)
ON CONFLICT DO NOTHING;

-- Grants
GRANT ALL ON shift_templates TO service_role;
GRANT ALL ON work_locations TO service_role;
GRANT ALL ON rotas TO service_role;
GRANT ALL ON shift_assignments TO service_role;
GRANT ALL ON staff_availability TO service_role;
GRANT ALL ON shift_swap_requests TO service_role;
