-- Add trigger to automatically recalculate points when predictions change
-- Run this in your Supabase SQL Editor

-- Function to trigger point recalculation
CREATE OR REPLACE FUNCTION trigger_recalculate_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate points for the user
    PERFORM calculate_user_points(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only add the table prediction trigger for now (remove fixture trigger to avoid errors)
CREATE TRIGGER trigger_recalculate_table_points
    AFTER UPDATE OF table_prediction ON user_profiles
    FOR EACH ROW
    WHEN (OLD.table_prediction IS DISTINCT FROM NEW.table_prediction)
    EXECUTE FUNCTION trigger_recalculate_points();
