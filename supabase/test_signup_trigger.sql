-- Test the signup trigger manually
-- This simulates what happens when a user signs up

-- First, let's see if we can manually call the handle_new_user function
-- (This won't work directly, but let's test the create_user_profile_with_defaults function)

-- Test the create_user_profile_with_defaults function
SELECT 'Testing create_user_profile_with_defaults function:' as info;

-- This should work if the function exists
SELECT create_user_profile_with_defaults(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'test@example.com',
  'Test User'
) as test_result;

-- Check if the test profile was created
SELECT 'Test profile created:' as info;
SELECT * FROM user_profiles 
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Clean up the test profile
DELETE FROM user_profiles 
WHERE user_id = '00000000-0000-0000-0000-000000000000';

SELECT 'Test profile cleaned up' as info;
