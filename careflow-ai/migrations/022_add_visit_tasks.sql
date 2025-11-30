-- ============================================
-- Phase 5: Mobile Carer View - Visit Tasks
-- ============================================

-- Add 'tasks' column to visits table to store the checklist
-- Format: JSONB array of objects: { id: string, label: string, completed: boolean }
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]';

-- Add index for better performance if we query by tasks (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_visits_tasks ON visits USING gin (tasks);
