-- Check Supabase Auth configuration
-- Run this in Supabase SQL Editor

-- 1. Check if auth.users table exists and is accessible
SELECT 'auth.users table exists:' as info;
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
) as auth_users_exists;

-- 2. Check if we can see the auth schema
SELECT 'auth schema tables:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- 3. Check if there are any existing users
SELECT 'Existing users count:' as info;
SELECT COUNT(*) as user_count FROM auth.users;

-- 4. Check if the trigger exists on auth.users
SELECT 'Triggers on auth.users:' as info;
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 5. Check if we have permission to insert into auth.users
SELECT 'Current user permissions:' as info;
SELECT current_user, session_user;

-- 6. Check if the handle_new_user function exists and is accessible
SELECT 'handle_new_user function:' as info;
SELECT routine_name, routine_type, security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'handle_new_user';
