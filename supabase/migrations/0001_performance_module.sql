-- Performance Management Module Migration
-- Run this file to create all performance management tables in your Supabase database
-- Execute in order - tables have dependencies

-- 1. Performance Review Types
\i supabase/tables/performance_review_types.sql

-- 2. Performance Criteria
\i supabase/tables/performance_criteria.sql

-- 3. Performance Reviews
\i supabase/tables/performance_reviews.sql

-- 4. Review Participants
\i supabase/tables/review_participants.sql

-- 5. Performance Ratings
\i supabase/tables/performance_ratings.sql

-- 6. Performance Goals
\i supabase/tables/performance_goals.sql

-- 7. KPI Definitions
\i supabase/tables/kpi_definitions.sql

-- 8. KPI Values
\i supabase/tables/kpi_values.sql

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_reviews_composite ON performance_reviews(employee_id, status, review_due_date);
CREATE INDEX IF NOT EXISTS idx_performance_goals_composite ON performance_goals(employee_id, status, target_date);
CREATE INDEX IF NOT EXISTS idx_kpi_values_composite ON kpi_values(employee_id, kpi_definition_id, period_start);

-- Grant permissions
GRANT ALL ON performance_review_types TO authenticated;
GRANT ALL ON performance_criteria TO authenticated;
GRANT ALL ON performance_reviews TO authenticated;
GRANT ALL ON review_participants TO authenticated;
GRANT ALL ON performance_ratings TO authenticated;
GRANT ALL ON performance_goals TO authenticated;
GRANT ALL ON kpi_definitions TO authenticated;
GRANT ALL ON kpi_values TO authenticated;

-- Verify tables created
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE tablename LIKE 'performance%' 
   OR tablename LIKE 'review%' 
   OR tablename LIKE 'kpi%'
ORDER BY tablename;
