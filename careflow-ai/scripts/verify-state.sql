-- Quick verification queries
-- Run these in Supabase SQL Editor to check current state

-- Check 1: Role mappings count
SELECT COUNT(*) as role_mapping_count FROM role_mappings;

-- Check 2: View all role mappings
SELECT * FROM role_mappings ORDER BY novumflow_role;

-- Check 3: Storage buckets
SELECT id, name, public FROM storage.buckets WHERE id = 'documents';

-- Check 4: All storage buckets
SELECT id, name, public, created_at FROM storage.buckets ORDER BY created_at DESC;
