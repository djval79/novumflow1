-- Migration: Add tenant_id to attendance_records and leave_requests tables
-- This enables multi-tenant filtering for attendance and leave data

-- ============================================
-- 1. ADD TENANT_ID TO ATTENDANCE_RECORDS
-- ============================================

-- Add tenant_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_records' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE attendance_records 
        ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        
        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_attendance_records_tenant_id 
        ON attendance_records(tenant_id);
        
        -- Create index for tenant + date queries (common dashboard pattern)
        CREATE INDEX IF NOT EXISTS idx_attendance_records_tenant_date 
        ON attendance_records(tenant_id, date);
    END IF;
END $$;

-- ============================================
-- 2. ADD TENANT_ID TO LEAVE_REQUESTS
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE leave_requests 
        ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        
        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_id 
        ON leave_requests(tenant_id);
        
        -- Create index for tenant + status queries (dashboard pattern)
        CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_status 
        ON leave_requests(tenant_id, status);
    END IF;
END $$;

-- ============================================
-- 3. BACKFILL TENANT_ID FROM EMPLOYEE DATA
-- ============================================

-- Backfill attendance_records tenant_id from employees table
UPDATE attendance_records ar
SET tenant_id = e.tenant_id
FROM employees e
WHERE ar.employee_id = e.id 
  AND ar.tenant_id IS NULL;

-- Backfill leave_requests tenant_id from employees table  
UPDATE leave_requests lr
SET tenant_id = e.tenant_id
FROM employees e
WHERE lr.employee_id = e.id 
  AND lr.tenant_id IS NULL;

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Policy for attendance_records - users can only see their tenant's records
DROP POLICY IF EXISTS attendance_tenant_isolation ON attendance_records;
CREATE POLICY attendance_tenant_isolation ON attendance_records
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profiles
            WHERE user_id = auth.uid()
        )
    );

-- Policy for leave_requests - users can only see their tenant's records
DROP POLICY IF EXISTS leave_tenant_isolation ON leave_requests;
CREATE POLICY leave_tenant_isolation ON leave_requests
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profiles
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leave_requests TO authenticated;
