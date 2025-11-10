-- Performance optimizations for fixtures table
-- Since you reset data each season, we only need to index for single-season queries
-- Run this in your Supabase SQL Editor

-- ==============================================
-- INDEX 1: Matchday + Status (Most Important)
-- ==============================================
-- This speeds up queries like: "Get all fixtures for matchday 5 with status TIMED"
-- Without this: Database checks all 380 fixtures
-- With this: Database jumps straight to matchday 5, then filters by status
CREATE INDEX IF NOT EXISTS idx_fixtures_matchday_status 
ON fixtures(matchday, status);

COMMENT ON INDEX idx_fixtures_matchday_status IS 
'Speeds up queries filtering by matchday and status. Most common query pattern.';

-- ==============================================
-- INDEX 2: Upcoming Fixtures Only (Biggest Boost)
-- ==============================================
-- This creates a smaller, faster index for only upcoming matches (~100-150 fixtures)
-- Perfect for: Users viewing upcoming matches, cron job calculating percentages
-- Without this: Checks all 380 fixtures
-- With this: Only checks ~100-150 upcoming fixtures
CREATE INDEX IF NOT EXISTS idx_fixtures_upcoming 
ON fixtures(matchday, scheduled_date) 
WHERE status IN ('TIMED', 'SCHEDULED', 'IN_PLAY');

COMMENT ON INDEX idx_fixtures_upcoming IS 
'Smaller index for upcoming matches only. Speeds up most common user queries and cron job.';

-- ==============================================
-- INDEX 3: Scheduled Date (For Sorting)
-- ==============================================
-- This speeds up queries that order fixtures by date
-- Without this: Database sorts all 380 fixtures
-- With this: Data is already organized by date
CREATE INDEX IF NOT EXISTS idx_fixtures_scheduled_date 
ON fixtures(scheduled_date);

COMMENT ON INDEX idx_fixtures_scheduled_date IS 
'Speeds up sorting fixtures by scheduled_date. Used when ordering matches by time.';

-- ==============================================
-- INDEX 4: Status for Cron Job
-- ==============================================
-- This optimizes your cron job that calculates prediction percentages
-- Only indexes TIMED and SCHEDULED fixtures (the ones the cron processes)
-- Without this: Checks all 380 fixtures
-- With this: Only checks ~100-150 upcoming fixtures
CREATE INDEX IF NOT EXISTS idx_fixtures_status 
ON fixtures(status) 
WHERE status IN ('TIMED', 'SCHEDULED');

COMMENT ON INDEX idx_fixtures_status IS 
'Optimizes cron job that calculates prediction percentages for upcoming fixtures only.';

-- ==============================================
-- UPDATE STATISTICS (IMPORTANT!)
-- ==============================================
-- Tell the database about the indexes so it uses them
-- Run this after creating indexes
ANALYZE fixtures;

-- ==============================================
-- VERIFY INDEXES WERE CREATED
-- ==============================================
-- Run this to see all indexes on fixtures table:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'fixtures';
