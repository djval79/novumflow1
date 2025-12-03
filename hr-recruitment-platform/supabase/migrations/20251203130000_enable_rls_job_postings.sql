-- Enable RLS on job_postings table
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all job postings
CREATE POLICY "job_postings_select_policy" ON job_postings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert job postings
CREATE POLICY "job_postings_insert_policy" ON job_postings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own job postings
CREATE POLICY "job_postings_update_policy" ON job_postings
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow users to delete their own job postings
CREATE POLICY "job_postings_delete_policy" ON job_postings
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
