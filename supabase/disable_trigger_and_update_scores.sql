-- Disable trigger and update scores manually
-- Run this in Supabase SQL Editor

-- Disable the trigger temporarily
DROP TRIGGER IF EXISTS update_scores_trigger ON user_profiles;

-- Update all user scores with new system
UPDATE user_profiles 
SET 
  table_points = 232,  -- Your calculated score
  total_points = fixture_points + 232,
  updated_at = NOW()
WHERE user_id = '00000000-0000-0000-0000-000000000003';  -- Test user

-- Update your user (replace with your actual user_id)
-- UPDATE user_profiles 
-- SET 
--   table_points = 232,
--   total_points = fixture_points + 232,
--   updated_at = NOW()
-- WHERE email = 'your-email@example.com';

-- Check the results
SELECT user_id, email, display_name, table_points, fixture_points, total_points 
FROM user_profiles 
ORDER BY total_points DESC;

-- Re-enable the trigger
CREATE TRIGGER update_scores_trigger
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_scores();
