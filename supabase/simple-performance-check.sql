-- Simple performance check - run each query one at a time

-- 1. Check indexes (this should work)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'fixtures';

-- 2. Test query performance (this will show if indexes are used)
EXPLAIN ANALYZE
SELECT id, home_team_name, away_team_name, matchday, status, scheduled_date, 
       home_score, away_score, prediction_home_percent, prediction_draw_percent, 
       prediction_away_percent, prediction_total_count
FROM fixtures 
WHERE matchday = 5 
ORDER BY scheduled_date;

