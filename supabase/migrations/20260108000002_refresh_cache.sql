-- Dummy migration to refresh PostgREST cache
ALTER TABLE employees ADD COLUMN _dummy_cache_refresh BOOLEAN;
ALTER TABLE employees DROP COLUMN _dummy_cache_refresh;
