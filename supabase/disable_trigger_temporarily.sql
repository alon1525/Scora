-- Temporarily disable the trigger to test if it's causing the issue
-- Run this in Supabase SQL Editor

-- Disable the trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Check if trigger is disabled
SELECT 'Triggers on auth.users after disabling:' as info;
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- Test if we can manually create a user profile
-- (This won't work without a real user, but let's test the function)
SELECT 'Testing create_user_profile_with_defaults function:' as info;
SELECT create_user_profile_with_defaults(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'test@example.com',
  'Test User'
) as test_result;

-- Clean up test
DELETE FROM user_profiles WHERE user_id = '00000000-0000-0000-0000-000000000000';

SELECT 'Trigger disabled. Try signing up now. If it works, the trigger was the problem.' as info;
