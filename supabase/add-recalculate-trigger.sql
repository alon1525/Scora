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

-- Trigger to recalculate points when table_prediction is updated
CREATE TRIGGER trigger_recalculate_table_points
    AFTER UPDATE OF table_prediction ON user_profiles
    FOR EACH ROW
    WHEN (OLD.table_prediction IS DISTINCT FROM NEW.table_prediction)
    EXECUTE FUNCTION trigger_recalculate_points();

-- Trigger to recalculate points when fixture_predictions is updated
CREATE TRIGGER trigger_recalculate_fixture_points
    AFTER UPDATE OF fixture_predictions ON user_profiles
    FOR EACH ROW
    WHEN (OLD.fixture_predictions IS DISTINCT FROM NEW.fixture_predictions)
    EXECUTE FUNCTION trigger_recalculate_points();
