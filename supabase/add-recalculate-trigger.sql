-- Add trigger to automatically recalculate points when predictions change
-- Run this in your Supabase SQL Editor

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_recalculate_table_points ON user_profiles;

-- Function to trigger point recalculation (table points only)
CREATE OR REPLACE FUNCTION trigger_recalculate_table_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate ONLY table points (don't touch fixture points)
    PERFORM calculate_table_points_only(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only add the table prediction trigger for now (remove fixture trigger to avoid errors)
CREATE TRIGGER trigger_recalculate_table_points
    AFTER UPDATE OF table_prediction ON user_profiles
    FOR EACH ROW
    WHEN (OLD.table_prediction IS DISTINCT FROM NEW.table_prediction)
    EXECUTE FUNCTION trigger_recalculate_table_points();
