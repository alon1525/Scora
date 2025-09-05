-- Add prediction locking system
-- Run this in Supabase SQL Editor

-- Create a simple prediction lock function
CREATE OR REPLACE FUNCTION are_predictions_locked(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  lock_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the lock date for this user (if any)
  SELECT prediction_lock_date INTO lock_date
  FROM user_profiles 
  WHERE user_id = user_id_param;
  
  -- If no lock date set, predictions are not locked
  IF lock_date IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If lock date is in the past, predictions are locked
  RETURN lock_date <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Add prediction_lock_date column to user_profiles if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS prediction_lock_date TIMESTAMP WITH TIME ZONE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION are_predictions_locked(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION are_predictions_locked(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION are_predictions_locked(UUID) TO anon;

-- Test the function
SELECT are_predictions_locked('6a7cdd59-00a4-4be9-94ed-b62b20d5e65e'::UUID) as is_locked;

-- Example: Lock predictions for a user (set lock date to now)
-- UPDATE user_profiles 
-- SET prediction_lock_date = NOW() 
-- WHERE user_id = '6a7cdd59-00a4-4be9-94ed-b62b20d5e65e';

-- Example: Unlock predictions for a user (set lock date to null)
-- UPDATE user_profiles 
-- SET prediction_lock_date = NULL 
-- WHERE user_id = '6a7cdd59-00a4-4be9-94ed-b62b20d5e65e';
