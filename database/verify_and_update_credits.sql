-- =====================================================
-- VERIFY AND UPDATE DEFAULT FREE CREDITS
-- Run this in Supabase SQL Editor to verify the change
-- =====================================================

-- Step 1: Check current default value
SELECT 
  table_name,
  column_name,
  column_default,
  data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'free_credits';

-- Expected result: column_default should be '5'
-- If it shows '3', proceed with Step 2

-- Step 2: Update the default value to 5
ALTER TABLE profiles 
ALTER COLUMN free_credits SET DEFAULT 5;

-- Step 3: Verify the change was applied
SELECT 
  table_name,
  column_name,
  column_default,
  data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'free_credits';

-- Step 4: Check if there's a trigger creating profiles
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' 
OR event_object_table = 'profiles';

-- If you see a trigger like 'on_auth_user_created', 
-- you may need to update the trigger function as well

-- Step 5: Check for trigger functions with hardcoded '3'
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_definition LIKE '%free_credits%'
AND routine_type = 'FUNCTION';

-- Look for any functions that have '3' hardcoded in them
-- You'll need to update those functions manually if they exist

