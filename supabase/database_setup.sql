-- Complete Database Setup - No RLS Problems
-- This creates a working database from scratch

-- Drop everything first (clean slate)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Create tables
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  table_prediction TEXT[] DEFAULT ARRAY[
    'arsenal', 'aston-villa', 'bournemouth', 'brentford', 'brighton',
    'burnley', 'chelsea', 'crystal-palace', 'everton', 'fulham',
    'leeds-united', 'liverpool', 'man-city', 'man-united', 'newcastle',
    'nottingham', 'sunderland', 'tottenham', 'west-ham', 'wolves'
  ],
  fixture_predictions JSONB DEFAULT '{}',
  fixture_points INTEGER DEFAULT 0,
  table_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  -- New statistics fields
  exact_predictions INTEGER DEFAULT 0,
  result_predictions INTEGER DEFAULT 0,
  close_predictions INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  badges_count INTEGER DEFAULT 0,
  country_code TEXT DEFAULT 'GB', -- Default to Great Britain
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE fixtures (
  id SERIAL PRIMARY KEY,
  external_id INTEGER UNIQUE,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  home_team_name TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  home_team_logo TEXT,
  away_team_logo TEXT,
  matchday INTEGER,
  season TEXT DEFAULT '2025',
  status TEXT DEFAULT 'SCHEDULED',
  scheduled_date TIMESTAMP WITH TIME ZONE,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE standings (
  id SERIAL PRIMARY KEY,
  season TEXT DEFAULT '2025',
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
  UNIQUE(season, team_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_fixtures_external_id ON fixtures(external_id);
CREATE INDEX idx_fixtures_season_matchday ON fixtures(season, matchday);
CREATE INDEX idx_standings_season_position ON standings(season, position);

-- Create functions for scoring
CREATE OR REPLACE FUNCTION calculate_fixture_points(
  predicted_home INTEGER,
  predicted_away INTEGER,
  actual_home INTEGER,
  actual_away INTEGER
) RETURNS INTEGER AS $$
BEGIN
  -- Handle NULL scores as 0
  predicted_home := COALESCE(predicted_home, 0);
  predicted_away := COALESCE(predicted_away, 0);
  actual_home := COALESCE(actual_home, 0);
  actual_away := COALESCE(actual_away, 0);
  
  -- Exact score: 3 points
  IF predicted_home = actual_home AND predicted_away = actual_away THEN
    RETURN 3;
  END IF;
  
  -- Correct result (win/draw/loss): 1 point
  IF (predicted_home > predicted_away AND actual_home > actual_away) OR
     (predicted_home = predicted_away AND actual_home = actual_away) OR
     (predicted_home < predicted_away AND actual_home < actual_away) THEN
    RETURN 1;
  END IF;
  
  -- Wrong result: 0 points
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get prediction type for statistics
CREATE OR REPLACE FUNCTION get_prediction_type(
  predicted_home INTEGER,
  predicted_away INTEGER,
  actual_home INTEGER,
  actual_away INTEGER
) RETURNS TEXT AS $$
BEGIN
  -- Handle NULL scores as 0
  predicted_home := COALESCE(predicted_home, 0);
  predicted_away := COALESCE(predicted_away, 0);
  actual_home := COALESCE(actual_home, 0);
  actual_away := COALESCE(actual_away, 0);
  
  -- Exact score
  IF predicted_home = actual_home AND predicted_away = actual_away THEN
    RETURN 'exact';
  END IF;
  
  -- Correct result (win/draw/loss)
  IF (predicted_home > predicted_away AND actual_home > actual_away) OR
     (predicted_home = predicted_away AND actual_home = actual_away) OR
     (predicted_home < predicted_away AND actual_home < actual_away) THEN
    RETURN 'result';
  END IF;
  
  -- Close prediction (within 1 goal difference)
  IF ABS(predicted_home - actual_home) <= 1 AND ABS(predicted_away - actual_away) <= 1 THEN
    RETURN 'close';
  END IF;
  
  -- Miss
  RETURN 'miss';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_table_points(
  predicted_positions TEXT[],
  season_param TEXT DEFAULT '2025'
) RETURNS INTEGER AS $$
DECLARE
  total_points INTEGER := 0; -- Start with 0, add points for each team
  i INTEGER;
  predicted_team TEXT;
  actual_position INTEGER;
  team_points INTEGER;
BEGIN
  -- For each team in predicted order
  FOR i IN 1..array_length(predicted_positions, 1) LOOP
    predicted_team := predicted_positions[i];
    
    -- Get actual position from standings table
    SELECT position INTO actual_position
    FROM standings 
    WHERE team_id = predicted_team AND season = season_param;
    
    -- If team not found in standings, 0 points for this team
    IF actual_position IS NULL THEN
      team_points := 0;
    ELSE
      -- Each team gives 20 points, minus 1 for each position wrong
      team_points := 20 - ABS(i - actual_position);
      team_points := GREATEST(0, team_points); -- Don't go below 0
    END IF;
    
    total_points := total_points + team_points;
  END LOOP;
  
  RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user statistics
CREATE OR REPLACE FUNCTION calculate_user_statistics(user_id_param UUID)
RETURNS TABLE(
  exact_predictions INTEGER,
  result_predictions INTEGER,
  close_predictions INTEGER,
  total_predictions INTEGER,
  fixture_points INTEGER
) AS $$
DECLARE
  user_profile RECORD;
  exact_count INTEGER := 0;
  result_count INTEGER := 0;
  close_count INTEGER := 0;
  total_count INTEGER := 0;
  points_total INTEGER := 0;
  prediction_key TEXT;
  prediction_data JSONB;
  predicted_home INTEGER;
  predicted_away INTEGER;
  actual_home INTEGER;
  actual_away INTEGER;
  prediction_type TEXT;
  fixture_id INTEGER;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM user_profiles WHERE user_id = user_id_param;
  
  IF user_profile IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0, 0, 0;
    RETURN;
  END IF;
  
  -- Loop through fixture predictions
  FOR prediction_key, prediction_data IN 
    SELECT key, value FROM jsonb_each(user_profile.fixture_predictions)
  LOOP
    -- Skip if no prediction data
    IF prediction_data IS NULL OR prediction_data = '{}' THEN
      CONTINUE;
    END IF;
    
    -- Get predicted scores
    predicted_home := COALESCE((prediction_data->>'home_score')::INTEGER, 0);
    predicted_away := COALESCE((prediction_data->>'away_score')::INTEGER, 0);
    
    -- Get fixture ID from key
    fixture_id := prediction_key::INTEGER;
    
    -- Get actual scores from fixtures table
    SELECT COALESCE(f.home_score, 0), COALESCE(f.away_score, 0)
    INTO actual_home, actual_away
    FROM fixtures f
    WHERE f.id = fixture_id;
    
    -- Skip if fixture not found or not played yet
    IF actual_home IS NULL AND actual_away IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Count this prediction
    total_count := total_count + 1;
    
    -- Get prediction type and add points
    SELECT get_prediction_type(predicted_home, predicted_away, actual_home, actual_away) INTO prediction_type;
    
    CASE prediction_type
      WHEN 'exact' THEN
        exact_count := exact_count + 1;
        points_total := points_total + 3;
      WHEN 'result' THEN
        result_count := result_count + 1;
        points_total := points_total + 1;
      WHEN 'close' THEN
        close_count := close_count + 1;
      ELSE
        -- miss - no points
        NULL;
    END CASE;
  END LOOP;
  
  RETURN QUERY SELECT exact_count, result_count, close_count, total_count, points_total;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_scores(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  user_profile RECORD;
  fixture_points INTEGER := 0;
  table_points INTEGER := 0;
  total_points INTEGER := 0;
  exact_count INTEGER := 0;
  result_count INTEGER := 0;
  close_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM user_profiles WHERE user_id = user_id_param;
  
  IF user_profile IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate statistics and fixture points
  SELECT 
    exact_predictions,
    result_predictions,
    close_predictions,
    total_predictions,
    fixture_points
  INTO 
    exact_count,
    result_count,
    close_count,
    total_count,
    fixture_points
  FROM calculate_user_statistics(user_id_param);
  
  -- Calculate table points using actual standings
  SELECT calculate_table_points(user_profile.table_prediction, '2025') INTO table_points;
  
  -- Calculate total
  total_points := fixture_points + table_points;
  
  -- Update user profile with all statistics
  UPDATE user_profiles 
  SET 
    fixture_points = fixture_points,
    table_points = table_points,
    total_points = total_points,
    exact_predictions = exact_count,
    result_predictions = result_count,
    close_predictions = close_count,
    total_predictions = total_count,
    updated_at = NOW()
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update scores
CREATE OR REPLACE FUNCTION trigger_update_scores()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_scores(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scores_trigger
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_scores();

-- Grant permissions to service_role (for backend)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant permissions to authenticated users (for frontend)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (for public data)
GRANT SELECT ON standings TO anon;
GRANT SELECT ON fixtures TO anon;

-- Enable RLS and create proper policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (bypasses RLS)
CREATE POLICY "Service role full access user_profiles" ON user_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access fixtures" ON fixtures
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access standings" ON standings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Users can manage their own profile
CREATE POLICY "Users manage own profile" ON user_profiles
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Public can read fixtures and standings
CREATE POLICY "Public read fixtures" ON fixtures
  FOR SELECT TO public USING (true);

CREATE POLICY "Public read standings" ON standings
  FOR SELECT TO public USING (true);

-- Authenticated users can read fixtures
CREATE POLICY "Authenticated read fixtures" ON fixtures
  FOR SELECT TO authenticated USING (true);

-- Insert sample standings data
INSERT INTO standings (season, team_id, position, team_name, played, wins, draws, losses, goals_for, goals_against, goal_difference, points) VALUES
('2025', 'arsenal', 1, 'Arsenal FC', 20, 15, 3, 2, 45, 20, 25, 48),
('2025', 'man-city', 2, 'Manchester City', 20, 14, 4, 2, 50, 22, 28, 46),
('2025', 'liverpool', 3, 'Liverpool FC', 20, 13, 5, 2, 42, 18, 24, 44),
('2025', 'aston-villa', 4, 'Aston Villa', 20, 12, 4, 4, 38, 25, 13, 40),
('2025', 'tottenham', 5, 'Tottenham Hotspur', 20, 11, 5, 4, 40, 28, 12, 38),
('2025', 'man-united', 6, 'Manchester United', 20, 10, 6, 4, 32, 26, 6, 36),
('2025', 'west-ham', 7, 'West Ham United', 20, 10, 5, 5, 35, 30, 5, 35),
('2025', 'newcastle', 8, 'Newcastle United', 20, 9, 7, 4, 33, 28, 5, 34),
('2025', 'chelsea', 9, 'Chelsea FC', 20, 9, 6, 5, 31, 25, 6, 33),
('2025', 'brighton', 10, 'Brighton & Hove Albion', 20, 8, 8, 4, 30, 25, 5, 32),
('2025', 'crystal-palace', 11, 'Crystal Palace', 20, 8, 6, 6, 28, 27, 1, 30),
('2025', 'wolves', 12, 'Wolverhampton Wanderers', 20, 7, 8, 5, 26, 26, 0, 29),
('2025', 'fulham', 13, 'Fulham FC', 20, 7, 7, 6, 27, 28, -1, 28),
('2025', 'brentford', 14, 'Brentford FC', 20, 6, 9, 5, 25, 26, -1, 27),
('2025', 'everton', 15, 'Everton FC', 20, 6, 8, 6, 22, 25, -3, 26),
('2025', 'nottingham', 16, 'Nottingham Forest', 20, 5, 9, 6, 21, 26, -5, 24),
('2025', 'luton-town', 17, 'Luton Town', 20, 4, 8, 8, 20, 32, -12, 20),
('2025', 'burnley', 18, 'Burnley FC', 20, 3, 7, 10, 18, 35, -17, 16),
('2025', 'sheffield-united', 19, 'Sheffield United', 20, 2, 5, 13, 15, 45, -30, 11),
('2025', 'bournemouth', 20, 'AFC Bournemouth', 20, 1, 4, 15, 12, 48, -36, 7);

-- Success message
SELECT 'Database setup complete! All tables, functions, and permissions created successfully.' as message;
