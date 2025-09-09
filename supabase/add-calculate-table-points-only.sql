-- Function to calculate ONLY table points (when table prediction changes)
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION calculate_table_points_only(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    calc_table_points INTEGER := 0;
    user_prediction TEXT[];
    actual_standings TEXT[];
    correct_positions INTEGER := 0;
    i INTEGER;
    current_fixture_points INTEGER := 0;
    calc_total_points INTEGER := 0;
BEGIN
    -- Get current fixture points (don't touch them)
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
    
    -- Calculate table prediction points
    IF user_prediction IS NOT NULL AND actual_standings IS NOT NULL THEN
        -- Count correct positions (each correct position = 1 point)
        FOR i IN 1..LEAST(array_length(user_prediction, 1), array_length(actual_standings, 1)) LOOP
            IF user_prediction[i] = actual_standings[i] THEN
                correct_positions := correct_positions + 1;
            END IF;
        END LOOP;
        calc_table_points := correct_positions;
    END IF;
    
    calc_total_points := COALESCE(current_fixture_points, 0) + calc_table_points;
    
    -- Update user profile with calculated table points only
    UPDATE user_profiles
    SET 
        table_points = calc_table_points,
        total_points = calc_total_points,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN calc_table_points;
END;
$$ LANGUAGE plpgsql;
