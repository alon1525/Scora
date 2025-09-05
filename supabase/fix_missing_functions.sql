-- Fix missing database functions
-- Run this in Supabase SQL Editor

-- Create the missing are_predictions_locked function
CREATE OR REPLACE FUNCTION are_predictions_locked(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- For now, predictions are never locked
  -- You can modify this logic later if you want to add locking
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION are_predictions_locked(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION are_predictions_locked(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION are_predictions_locked(UUID) TO anon;

-- Test the function
SELECT are_predictions_locked('6a7cdd59-00a4-4be9-94ed-b62b20d5e65e'::UUID) as is_locked;
