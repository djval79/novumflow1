
-- Phase 3.2: Shared Document Repository - Database Setup
-- 1. Ensure document_uploads exists (it might have been missed in some environments)
CREATE TABLE IF NOT EXISTS public.document_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID,
    application_id UUID,
    upload_batch_id UUID,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_category VARCHAR(100),
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_extension VARCHAR(20),
    file_hash VARCHAR(255),
    upload_status VARCHAR(50) DEFAULT 'uploaded' CHECK (upload_status IN ('uploading', 'uploaded', 'processing', 'verified', 'rejected', 'quarantined')),
    virus_scan_status VARCHAR(50) DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'scanning', 'clean', 'infected', 'suspicious')),
    virus_scan_timestamp TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMP,
    verification_notes TEXT,
    expiry_date DATE,
    expiry_reminder_sent BOOLEAN DEFAULT false,
    is_current_version BOOLEAN DEFAULT true,
    version_number INTEGER DEFAULT 1,
    replaced_by UUID,
    previous_version_id UUID,
    tags TEXT,
    metadata TEXT,
    ocr_extracted_text TEXT,
    ocr_processed BOOLEAN DEFAULT false,
    auto_categorized BOOLEAN DEFAULT false,
    categorization_confidence DECIMAL(5,2),
    access_level VARCHAR(50) DEFAULT 'private' CHECK (access_level IN ('private', 'internal', 'confidential', 'public')),
    access_log_enabled BOOLEAN DEFAULT true,
    retention_policy VARCHAR(100),
    deletion_scheduled_date DATE,
    is_encrypted BOOLEAN DEFAULT false,
    encryption_method VARCHAR(100),
    thumbnail_url TEXT,
    preview_available BOOLEAN DEFAULT false,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add tenant_id if missing
ALTER TABLE public.document_uploads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 3. Backfill tenant_id from linked employees
UPDATE public.document_uploads d
SET tenant_id = e.tenant_id
FROM public.employees e
WHERE d.employee_id = e.id
AND d.tenant_id IS NULL;

-- 4. Update RLS policies to be tenant-aware
ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.document_uploads;
CREATE POLICY "Allow read for tenant members" ON public.document_uploads
    FOR SELECT
    USING (public.user_has_tenant_access(tenant_id));

DROP POLICY IF EXISTS "Allow insert via edge function" ON public.document_uploads;
CREATE POLICY "Allow insert for tenant members" ON public.document_uploads
    FOR INSERT
    WITH CHECK (public.user_has_tenant_access(tenant_id));

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_document_uploads_tenant ON public.document_uploads(tenant_id);

-- 6. Add a view for unified documents
CREATE OR REPLACE VIEW public.unified_employee_documents AS
SELECT 
    d.id,
    d.tenant_id,
    d.employee_id,
    d.document_name as name,
    d.document_type as type,
    d.document_category as category,
    d.file_url,
    d.file_size_bytes as size,
    d.uploaded_at as created_at,
    'novumflow' as source
FROM public.document_uploads d
UNION ALL
SELECT
    cd.id,
    cd.tenant_id,
    s.novumflow_employee_id as employee_id,
    cd.name,
    cd.file_type as type,
    cd.category,
    cd.file_url,
    cd.file_size as size,
    cd.created_at,
    'careflow' as source
FROM public.careflow_documents cd
JOIN public.careflow_staff s ON cd.uploaded_by = s.user_id AND cd.tenant_id = s.tenant_id
WHERE s.novumflow_employee_id IS NOT NULL;
