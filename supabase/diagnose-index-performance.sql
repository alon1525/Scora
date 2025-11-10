-- Diagnose why indexes might be slowing things down
-- Run this in Supabase SQL Editor to check what's happening

-- 1. Check if indexes exist
SELECT 
    indexname, 
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE tablename = 'fixtures'
ORDER BY indexname;

-- 2. Check table statistics (important for query planner)
SELECT 
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    n_live_tup as row_count
FROM pg_stat_user_tables 
WHERE tablename = 'fixtures';

-- 3. Force update statistics so database knows about indexes
ANALYZE fixtures;

-- 4. Check if query is using indexes (run this after ANALYZE)
-- Replace with your actual query pattern
EXPLAIN ANALYZE
SELECT * FROM fixtures 
WHERE matchday = 5 
AND status IN ('TIMED', 'SCHEDULED')
ORDER BY scheduled_date;

