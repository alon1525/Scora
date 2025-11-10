-- Fix indexes to include season (even though you reset each season, queries still filter by it)
-- The database needs season in the index to use it efficiently

-- Drop the old indexes first
DROP INDEX IF EXISTS idx_fixtures_matchday_status;
DROP INDEX IF EXISTS idx_fixtures_upcoming;
DROP INDEX IF EXISTS idx_fixtures_scheduled_date;
DROP INDEX IF EXISTS idx_fixtures_status;

-- ==============================================
-- INDEX 1: Season + Matchday + Status (Most Important)
-- ==============================================
-- Your query filters by: season='2025', matchday=X, then orders by scheduled_date
-- Index must match the query pattern: season first, then matchday
CREATE INDEX IF NOT EXISTS idx_fixtures_season_matchday_status 
ON fixtures(season, matchday, status);

-- ==============================================
-- INDEX 2: Season + Scheduled Date (For Sorting)
-- ==============================================
-- Speeds up: ORDER BY scheduled_date when filtering by season
CREATE INDEX IF NOT EXISTS idx_fixtures_season_scheduled_date 
ON fixtures(season, scheduled_date);

-- ==============================================
-- INDEX 3: Upcoming Fixtures (Partial Index)
-- ==============================================
-- Smaller index for upcoming matches only
CREATE INDEX IF NOT EXISTS idx_fixtures_upcoming 
ON fixtures(season, matchday, scheduled_date) 
WHERE status IN ('TIMED', 'SCHEDULED', 'IN_PLAY');

-- ==============================================
-- INDEX 4: Status for Cron Job (Partial Index)
-- ==============================================
-- For cron job that calculates prediction percentages
CREATE INDEX IF NOT EXISTS idx_fixtures_status_season 
ON fixtures(season, status) 
WHERE status IN ('TIMED', 'SCHEDULED');

-- ==============================================
-- UPDATE STATISTICS (IMPORTANT!)
-- ==============================================
-- Tell the database about the new indexes and data distribution
ANALYZE fixtures;

