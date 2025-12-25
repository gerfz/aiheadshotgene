-- Fix email verification flow
-- Run this in Supabase SQL Editor

-- Step 1: Check if the trigger exists and is working
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_email_verified';

-- Step 2: Drop and recreate the email verification sync trigger
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
DROP FUNCTION IF EXISTS sync_email_verification() CASCADE;

-- Step 3: Create improved sync function
CREATE OR REPLACE FUNCTION sync_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Log for debugging
  RAISE LOG 'Email verification trigger fired for user: %', NEW.id;
  
  -- Update profile when email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL THEN
    -- Update email_verified status
    UPDATE public.profiles 
    SET 
      email_verified = TRUE,
      updated_at = NOW()
    WHERE id = NEW.id;
    
    RAISE LOG 'Updated email_verified for user: %', NEW.id;
    
    -- Award credits if not already awarded
    UPDATE public.profiles
    SET 
      free_credits = CASE 
        WHEN credits_awarded = FALSE THEN 3
        ELSE free_credits
      END,
      credits_awarded = TRUE,
      updated_at = NOW()
    WHERE id = NEW.id AND credits_awarded = FALSE;
    
    RAISE LOG 'Credits awarded for user: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger that fires on ANY update to auth.users
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_verification();

-- Step 5: Manually sync any users who are already verified but not marked in profiles
UPDATE public.profiles p
SET 
  email_verified = TRUE,
  free_credits = CASE 
    WHEN p.credits_awarded = FALSE THEN 3
    ELSE p.free_credits
  END,
  credits_awarded = TRUE,
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id 
  AND u.email_confirmed_at IS NOT NULL
  AND p.email_verified = FALSE;

-- Step 6: Verify the fix worked
SELECT 
  p.id,
  p.email,
  p.email_verified,
  p.credits_awarded,
  p.free_credits,
  u.email_confirmed_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 10;

