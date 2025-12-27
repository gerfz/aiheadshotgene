-- Fix email update permissions for profiles table
-- Run this in Supabase SQL Editor

-- Step 1: Ensure the email column exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Check current RLS policies
-- You can view them in Supabase Dashboard → Authentication → Policies

-- Step 3: Drop any conflicting policies (if they exist)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile for verification" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile email" ON public.profiles;

-- Step 4: Create a comprehensive UPDATE policy
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 5: Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create SELECT policy (if not exists)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Step 7: Test the update (replace YOUR_USER_ID with your actual user ID)
-- UPDATE public.profiles
-- SET email = 'test@example.com'
-- WHERE id = 'YOUR_USER_ID';

-- Step 8: Verify the update worked
-- SELECT id, email FROM public.profiles WHERE id = 'YOUR_USER_ID';

-- Step 9: Check if there are any triggers that might be interfering
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- Step 10: Grant permissions to authenticated role
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verification query - run this to check your setup
SELECT 
    'Column exists' as check_type,
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'email'
    ) as result
UNION ALL
SELECT 
    'RLS enabled' as check_type,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles') as result
UNION ALL
SELECT 
    'Update policy exists' as check_type,
    EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND cmd = 'UPDATE'
    ) as result;

