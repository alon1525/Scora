-- Check why fixtures queries are slow (5 seconds)
-- Run these queries in Supabase SQL Editor to diagnose

-- 1. Check how many fixtures we have
SELECT COUNT(*) as total_fixtures FROM fixtures;

-- 2. Check existing indexes
SELECT 
    indexname, 
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE tablename = 'fixtures'
ORDER BY indexname;

-- 3. Check table size
SELECT 
    pg_size_pretty(pg_total_relation_size('fixtures')) as total_size,
    pg_size_pretty(pg_relation_size('fixtures')) as table_size,
    pg_size_pretty(pg_indexes_size('fixtures')) as indexes_size;

-- 4. See what the query planner does (this shows if indexes are used)
EXPLAIN ANALYZE
SELECT id, external_id, home_team_id, away_team_id, home_team_name, away_team_name, 
       home_team_logo, away_team_logo, matchday, status, scheduled_date, 
       home_score, away_score, prediction_home_percent, prediction_draw_percent, 
       prediction_away_percent, prediction_total_count
FROM fixtures 
WHERE matchday = 5 
ORDER BY scheduled_date;

-- 5. Check if statistics are up to date
SELECT 
    schemaname,
    relname as tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    n_live_tup as row_count
FROM pg_stat_user_tables 
WHERE relname = 'fixtures';

-- 6. Force update statistics
ANALYZE fixtures;

