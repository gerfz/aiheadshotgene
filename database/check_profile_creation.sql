-- Check what's creating profiles automatically

-- 1. Check for triggers on auth.users that create profiles
SELECT 
  'Triggers on auth.users:' as info,
  tgname as trigger_name,
  proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users'
ORDER BY tgname;

-- 2. Look for functions that might be creating profiles
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%profile%'
ORDER BY routine_name;

-- 3. Check RLS policies
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

