-- Test the database setup
-- Run this in Supabase SQL Editor to check what's working

-- 1. Check if user_profiles table exists and has correct structure
SELECT 'user_profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 2. Check if the trigger exists
SELECT 'Triggers on auth.users:' as info;
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 3. Check if the handle_new_user function exists
SELECT 'Functions:' as info;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'handle_new_user';

-- 4. Test the create_default_table_prediction function
SELECT 'Testing create_default_table_prediction function:' as info;
SELECT create_default_table_prediction() as default_prediction;

-- 5. Check RLS policies on user_profiles
SELECT 'RLS policies on user_profiles:' as info;
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 6. Check if there are any existing users in auth.users
SELECT 'Existing users count:' as info;
SELECT COUNT(*) as user_count FROM auth.users;

-- 7. Check if there are any existing user_profiles
SELECT 'Existing user_profiles count:' as info;
SELECT COUNT(*) as profile_count FROM user_profiles;
