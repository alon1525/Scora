-- Add User Statistics Fields to Existing Database
-- Run this in Supabase SQL Editor to add new statistics features

-- Add new columns to existing user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS exact_predictions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS result_predictions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS close_predictions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_predictions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'GB';

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

-- Update the existing update_user_scores function to include statistics
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

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION get_prediction_type(INTEGER, INTEGER, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION calculate_user_statistics(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_user_scores(UUID) TO service_role;

-- Success message
SELECT 'User statistics fields and functions added successfully!' as message;
