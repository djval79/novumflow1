-- =================================================================
-- Phase 4: Shared Storage & Security
-- =================================================================

-- 1. Ensure 'documents' bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow Authenticated Users to View Documents
-- note: in a real multi-tenant setup, we should restrict by folder name corresponding to tenant_id
-- e.g. (storage.foldername(name))[1] = auth.uid() or similar.
-- For now, we allow authenticated users to view all documents to facilitate cross-app sharing.
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- 4. Policy: Allow Authenticated Users to Upload Documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- 5. Policy: Allow Users to Update/Delete their own uploads
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND owner = auth.uid());

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND owner = auth.uid());
