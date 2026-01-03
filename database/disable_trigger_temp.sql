-- TEMPORARY FIX: Disable the trigger causing database errors
-- This allows anonymous users to be created successfully
-- Device tracking will be handled by the backend instead

-- 1. Disable the trigger that's causing the error
ALTER TABLE profiles DISABLE TRIGGER IF EXISTS trigger_set_device_id;

-- 2. Drop the trigger completely (we'll handle it in backend)
DROP TRIGGER IF EXISTS trigger_set_device_id ON profiles;

-- 3. Keep the index but remove unique constraint
DROP INDEX IF EXISTS idx_profiles_device_id_unique;
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON profiles(device_id);

-- 4. Verify triggers are removed
SELECT 
  'Triggers on profiles table:' as info,
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'profiles';

-- 5. Check if there are any other triggers on auth.users that might be creating profiles
SELECT 
  'Triggers on auth.users:' as info,
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users';

