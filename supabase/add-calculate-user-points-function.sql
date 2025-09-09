-- Add calculate_user_points function to database
-- Run this in your Supabase SQL Editor

-- Function to calculate user points (fixture + table predictions)
CREATE OR REPLACE FUNCTION calculate_user_points(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    fixture_points INTEGER := 0;
    table_points INTEGER := 0;
    total_points INTEGER := 0;
    user_prediction TEXT[];
    actual_standings TEXT[];
    correct_positions INTEGER := 0;
    fixture_prediction JSONB;
    fixture_result JSONB;
    prediction_home INTEGER;
    prediction_away INTEGER;
    actual_home INTEGER;
    actual_away INTEGER;
    fixture_score INTEGER;
    fixture_id TEXT;
    prediction JSONB;
    i INTEGER;
BEGIN
    -- Get user's table prediction
    SELECT table_prediction INTO user_prediction
    FROM user_profiles
    WHERE user_id = p_user_id;
    
    -- Get actual standings (ordered by position)
    SELECT ARRAY_AGG(team_id ORDER BY position) INTO actual_standings
    FROM standings
    WHERE season = '2025';
    
    -- Calculate table prediction points
    IF user_prediction IS NOT NULL AND actual_standings IS NOT NULL THEN
        -- Count correct positions (each correct position = 1 point)
        FOR i IN 1..LEAST(array_length(user_prediction, 1), array_length(actual_standings, 1)) LOOP
            IF user_prediction[i] = actual_standings[i] THEN
                correct_positions := correct_positions + 1;
            END IF;
        END LOOP;
        table_points := correct_positions;
    END IF;
    
    -- Calculate fixture prediction points
    SELECT fixture_predictions INTO fixture_prediction
    FROM user_profiles
    WHERE user_id = p_user_id;
    
    IF fixture_prediction IS NOT NULL THEN
        -- Loop through each fixture prediction
        FOR fixture_id, prediction IN SELECT * FROM jsonb_each(fixture_prediction) LOOP
            -- Get the actual result from fixtures table
            SELECT 
                CASE WHEN home_score IS NOT NULL AND away_score IS NOT NULL 
                     THEN jsonb_build_object('home', home_score, 'away', away_score)
                     ELSE NULL END
            INTO fixture_result
            FROM fixtures
            WHERE external_id = (fixture_id::TEXT)::INTEGER
            AND status = 'FINISHED';
            
            -- If we have both prediction and result, calculate points
            IF prediction IS NOT NULL AND fixture_result IS NOT NULL THEN
                prediction_home := (prediction->>'home')::INTEGER;
                prediction_away := (prediction->>'away')::INTEGER;
                actual_home := (fixture_result->>'home')::INTEGER;
                actual_away := (fixture_result->>'away')::INTEGER;
                
                -- Calculate points for this fixture
                IF prediction_home = actual_home AND prediction_away = actual_away THEN
                    fixture_score := 3; -- Exact prediction
                ELSIF (prediction_home > prediction_away AND actual_home > actual_away) OR
                      (prediction_home < prediction_away AND actual_home < actual_away) OR
                      (prediction_home = prediction_away AND actual_home = actual_away) THEN
                    fixture_score := 1; -- Correct result
                ELSE
                    fixture_score := 0; -- Wrong prediction
                END IF;
                
                fixture_points := fixture_points + fixture_score;
            END IF;
        END LOOP;
    END IF;
    
    total_points := fixture_points + table_points;
    
    -- Update user profile with calculated points
    UPDATE user_profiles
    SET 
        fixture_points = fixture_points,
        table_points = table_points,
        total_points = total_points,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN total_points;
END;
$$ LANGUAGE plpgsql;