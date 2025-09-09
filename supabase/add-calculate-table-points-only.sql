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
    
    -- Calculate table prediction points (20 points per team, -1 for each position away)
    IF user_prediction IS NOT NULL AND actual_standings IS NOT NULL THEN
        -- For each team in prediction, find its actual position and calculate points
        FOR i IN 1..array_length(user_prediction, 1) LOOP
            DECLARE
                predicted_team TEXT := user_prediction[i];
                actual_position INTEGER;
                position_diff INTEGER;
                team_points INTEGER;
            BEGIN
                -- Find actual position of this team
                SELECT position INTO actual_position
                FROM standings
                WHERE team_id = predicted_team AND season = '2025';
                
                -- Calculate points: 20 - (difference in positions)
                IF actual_position IS NOT NULL THEN
                    position_diff := ABS(i - actual_position);
                    team_points := 20 - position_diff;
                    calc_table_points := calc_table_points + team_points;
                END IF;
            END;
        END LOOP;
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
