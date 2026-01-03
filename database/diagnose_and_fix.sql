-- Diagnose and fix the database error when creating anonymous users

-- 1. Check if there's an automatic profile creation trigger
SELECT 
  tgname as trigger_name,
  proname as function_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'profiles'
ORDER BY tgname;

-- 2. Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. Temporarily disable the trigger to test
ALTER TABLE profiles DISABLE TRIGGER trigger_set_device_id;

-- 4. Check if profiles table has all required columns with defaults
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

