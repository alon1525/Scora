-- Completely disable the problematic trigger
-- Run this in Supabase SQL Editor

-- Drop the trigger
DROP TRIGGER IF EXISTS update_scores_trigger ON user_profiles;

-- Drop the function that causes stack depth issues
DROP FUNCTION IF EXISTS trigger_update_scores();

-- Update scores manually with new system
UPDATE user_profiles 
SET 
  table_points = 282,  -- Your calculated score with new system
  total_points = fixture_points + 282,
  updated_at = NOW()
WHERE user_id = '6a7cdd59-00a4-4be9-94ed-b62b20d5e65e';  -- Your actual user ID

-- Also update test user
UPDATE user_profiles 
SET 
  table_points = 282,
  total_points = fixture_points + 282,
  updated_at = NOW()
WHERE user_id = '00000000-0000-0000-0000-000000000003';  -- Test user

-- Check the results
SELECT user_id, email, display_name, table_points, fixture_points, total_points 
FROM user_profiles 
ORDER BY total_points DESC;
