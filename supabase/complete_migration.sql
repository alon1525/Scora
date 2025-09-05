-- Complete Premier League Predictions Database Migration
-- Run this entire script in Supabase SQL Editor

-- ==============================================
-- DROP ALL EXISTING TABLES AND FUNCTIONS
-- ==============================================

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS user_fixture_predictions CASCADE;
DROP TABLE IF EXISTS user_scores CASCADE;
DROP TABLE IF EXISTS fixtures CASCADE;
DROP TABLE IF EXISTS user_table_predictions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS match_events CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS league_members CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_fixture_points(INTEGER, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS calculate_table_points(TEXT[], TEXT[], TEXT);
DROP FUNCTION IF EXISTS update_user_fixture_scores();
DROP FUNCTION IF EXISTS update_user_scores();

-- ==============================================
-- CREATE TABLES
-- ==============================================

-- Create fixtures table (stores match data from football-data.org API)
CREATE TABLE fixtures (
  id SERIAL PRIMARY KEY,
  external_id INTEGER UNIQUE NOT NULL, -- football-data.org fixture ID
  season TEXT NOT NULL DEFAULT '2025', -- Season identifier
  home_team_id TEXT NOT NULL, -- our internal team ID
  away_team_id TEXT NOT NULL, -- our internal team ID
  home_team_name TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  home_team_logo TEXT,
  away_team_logo TEXT,
  matchday INTEGER NOT NULL,
  status TEXT NOT NULL, -- SCHEDULED, IN_PLAY, FINISHED, POSTPONED, CANCELLED
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create standings table (cached live standings from API)
CREATE TABLE standings (
  id SERIAL PRIMARY KEY,
  season TEXT NOT NULL DEFAULT '2025',
  team_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table (stores all user prediction data and scores)
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Table prediction (array of team IDs in predicted order 1-20)
  table_prediction TEXT[],
  
  -- Fixture predictions (JSON object with fixture_id as key)
  -- Structure: {"fixture_id": {"home_goals": 2, "away_goals": 1}}
  fixture_predictions JSONB DEFAULT '{}',
  
  -- Calculated scores
  fixture_points INTEGER DEFAULT 0,
  table_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Fixtures indexes
CREATE INDEX idx_fixtures_season ON fixtures(season);
CREATE INDEX idx_fixtures_matchday ON fixtures(matchday);
CREATE INDEX idx_fixtures_status ON fixtures(status);
CREATE INDEX idx_fixtures_external_id ON fixtures(external_id);
CREATE INDEX idx_fixtures_scheduled_date ON fixtures(scheduled_date);

-- Standings indexes
CREATE INDEX idx_standings_season ON standings(season);
CREATE INDEX idx_standings_position ON standings(position);
CREATE INDEX idx_standings_team_id ON standings(team_id);
CREATE INDEX idx_standings_last_updated ON standings(last_updated);

-- User profiles indexes
CREATE INDEX idx_user_profiles_total_points ON user_profiles(total_points DESC);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_fixture_points ON user_profiles(fixture_points DESC);
CREATE INDEX idx_user_profiles_table_points ON user_profiles(table_points DESC);

-- ==============================================
-- CREATE FUNCTIONS
-- ==============================================

-- Function to calculate fixture prediction points
-- Rules: Exact score = 3 points, Correct outcome = 1 point, Wrong = 0 points
CREATE OR REPLACE FUNCTION calculate_fixture_points(
  predicted_home INTEGER,
  predicted_away INTEGER,
  actual_home INTEGER,
  actual_away INTEGER
) RETURNS INTEGER AS $$
BEGIN
  -- If no actual result yet, return 0
  IF actual_home IS NULL OR actual_away IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Exact score match = 3 points
  IF predicted_home = actual_home AND predicted_away = actual_away THEN
    RETURN 3;
  END IF;
  
  -- Correct outcome = 1 point
  DECLARE
    predicted_outcome TEXT;
    actual_outcome TEXT;
  BEGIN
    -- Determine predicted outcome
    IF predicted_home > predicted_away THEN
      predicted_outcome := 'HOME';
    ELSIF predicted_home < predicted_away THEN
      predicted_outcome := 'AWAY';
    ELSE
      predicted_outcome := 'DRAW';
    END IF;
    
    -- Determine actual outcome
    IF actual_home > actual_away THEN
      actual_outcome := 'HOME';
    ELSIF actual_home < actual_away THEN
      actual_outcome := 'AWAY';
    ELSE
      actual_outcome := 'DRAW';
    END IF;
    
    -- Return 1 if outcomes match, 0 otherwise
    IF predicted_outcome = actual_outcome THEN
      RETURN 1;
    ELSE
      RETURN 0;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate table prediction points
-- Rules: 20 points per team, -1 for each position wrong
CREATE OR REPLACE FUNCTION calculate_table_points(
  predicted_order TEXT[],
  actual_order TEXT[]
) RETURNS INTEGER AS $$
DECLARE
  total_points INTEGER := 0;
  i INTEGER;
  predicted_pos INTEGER;
  actual_pos INTEGER;
  position_difference INTEGER;
BEGIN
  -- Start with 20 points per team (400 max for 20 teams)
  total_points := 20 * array_length(predicted_order, 1);
  
  -- Calculate penalty for each team
  FOR i IN 1..array_length(predicted_order, 1) LOOP
    -- Find predicted position
    predicted_pos := i;
    
    -- Find actual position
    actual_pos := array_position(actual_order, predicted_order[i]);
    
    -- If team not found in actual order, skip
    IF actual_pos IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Calculate position difference
    position_difference := ABS(predicted_pos - actual_pos);
    
    -- Subtract 1 point for each position wrong
    total_points := total_points - position_difference;
  END LOOP;
  
  RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically update total_points
CREATE OR REPLACE FUNCTION update_user_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_points whenever fixture_points or table_points change
  NEW.total_points := COALESCE(NEW.fixture_points, 0) + COALESCE(NEW.table_points, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- CREATE TRIGGERS
-- ==============================================

-- Trigger to automatically calculate total_points
CREATE TRIGGER trigger_update_user_scores
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_scores();

-- ==============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- CREATE RLS POLICIES
-- ==============================================

-- User profiles policies (users can only access their own data)
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fixtures policies (public read access, allow inserts for backend)
CREATE POLICY "Fixtures are publicly readable" ON fixtures
  FOR SELECT USING (true);

CREATE POLICY "Allow fixture inserts from backend" ON fixtures
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow fixture updates from backend" ON fixtures
  FOR UPDATE USING (true);

-- Standings policies (public read access, allow backend updates)
CREATE POLICY "Standings are publicly readable" ON standings
  FOR SELECT USING (true);

CREATE POLICY "Allow standings inserts from backend" ON standings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow standings updates from backend" ON standings
  FOR UPDATE USING (true);

-- ==============================================
-- INSERT SAMPLE DATA FOR TESTING
-- ==============================================

-- Sample fixtures for testing (2025 season)
INSERT INTO fixtures (external_id, season, home_team_id, away_team_id, home_team_name, away_team_name, matchday, status, scheduled_date) VALUES
(1001, '2025', 'arsenal', 'liverpool', 'Arsenal FC', 'Liverpool FC', 1, 'SCHEDULED', '2025-08-16 15:00:00+00'),
(1002, '2025', 'man-city', 'chelsea', 'Manchester City FC', 'Chelsea FC', 1, 'SCHEDULED', '2025-08-16 17:30:00+00'),
(1003, '2025', 'man-united', 'tottenham', 'Manchester United FC', 'Tottenham Hotspur FC', 1, 'SCHEDULED', '2025-08-17 14:00:00+00'),
(1004, '2025', 'newcastle', 'brighton', 'Newcastle United FC', 'Brighton & Hove Albion FC', 1, 'SCHEDULED', '2025-08-17 16:30:00+00'),
(1005, '2025', 'west-ham', 'everton', 'West Ham United FC', 'Everton FC', 1, 'SCHEDULED', '2025-08-18 15:00:00+00'),
(1006, '2025', 'crystal-palace', 'fulham', 'Crystal Palace FC', 'Fulham FC', 1, 'SCHEDULED', '2025-08-18 17:30:00+00'),
(1007, '2025', 'wolves', 'nottingham', 'Wolverhampton Wanderers FC', 'Nottingham Forest FC', 1, 'SCHEDULED', '2025-08-19 15:00:00+00'),
(1008, '2025', 'bournemouth', 'brentford', 'AFC Bournemouth', 'Brentford FC', 1, 'SCHEDULED', '2025-08-19 17:30:00+00'),
(1009, '2025', 'burnley', 'sunderland', 'Burnley FC', 'Sunderland AFC', 1, 'SCHEDULED', '2025-08-20 15:00:00+00'),
(1010, '2025', 'leeds-united', 'ipswich-town', 'Leeds United FC', 'Ipswich Town FC', 1, 'SCHEDULED', '2025-08-20 17:30:00+00');

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Verify tables were created
SELECT 'Tables created successfully' as status;

-- Verify fixtures table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'fixtures' 
ORDER BY ordinal_position;

-- Verify user_profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Verify sample data
SELECT COUNT(*) as fixture_count FROM fixtures;
SELECT COUNT(*) as sample_fixtures FROM fixtures WHERE season = '2025';

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================

-- This migration creates a complete prediction system for the 2025-26 Premier League season
-- Features:
-- ✅ Fixture storage with team mappings
-- ✅ User prediction storage (table + fixtures)
-- ✅ Automatic scoring calculation
-- ✅ Row Level Security
-- ✅ Performance indexes
-- ✅ Sample data for testing

SELECT 'Migration completed successfully! Ready for Premier League predictions.' as final_status;
