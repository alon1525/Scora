-- Add calculate_user_points function to database
-- Run this in your Supabase SQL Editor

-- Function to calculate user points (fixture + table predictions)
CREATE OR REPLACE FUNCTION calculate_user_points(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    calc_fixture_points INTEGER := 0;
    calc_table_points INTEGER := 0;
    calc_total_points INTEGER := 0;
    user_prediction TEXT[];
    actual_standings TEXT[];
    correct_positions INTEGER := 0;
    i INTEGER;
    current_fixture_points INTEGER := 0;
BEGIN
    -- Get current fixture points (don't reset them)
    SELECT fixture_points INTO current_fixture_points
    FROM user_profiles
    WHERE user_id = p_user_id;
    
    -- Get user's table prediction
    SELECT table_prediction INTO user_prediction
    FROM user_profiles
    WHERE user_id = p_user_id;
    
    -- Get actual standings (ordered by position)
    SELECT ARRAY_AGG(team_id ORDER BY position) INTO actual_standings
    FROM standings
    WHERE season = '2025';
    
    -- Debug: Log what we found
    RAISE NOTICE 'User prediction: %', user_prediction;
    RAISE NOTICE 'Actual standings: %', actual_standings;
    RAISE NOTICE 'Current fixture points: %', current_fixture_points;
    
    -- Calculate table prediction points
    IF user_prediction IS NOT NULL AND actual_standings IS NOT NULL THEN
        -- Count correct positions (each correct position = 1 point)
        FOR i IN 1..LEAST(array_length(user_prediction, 1), array_length(actual_standings, 1)) LOOP
            IF user_prediction[i] = actual_standings[i] THEN
                correct_positions := correct_positions + 1;
            END IF;
        END LOOP;
        calc_table_points := correct_positions;
        RAISE NOTICE 'Correct positions: %', correct_positions;
    ELSE
        RAISE NOTICE 'Missing data - user_prediction: %, actual_standings: %', user_prediction IS NOT NULL, actual_standings IS NOT NULL;
    END IF;
    
    -- Keep existing fixture points (don't reset them)
    calc_fixture_points := COALESCE(current_fixture_points, 0);
    
    calc_total_points := calc_fixture_points + calc_table_points;
    
    -- Update user profile with calculated points
    UPDATE user_profiles
    SET 
        fixture_points = calc_fixture_points,
        table_points = calc_table_points,
        total_points = calc_total_points,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN calc_total_points;
END;
$$ LANGUAGE plpgsql;