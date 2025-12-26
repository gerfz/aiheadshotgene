-- Fix for existing anonymous users that don't have profiles
-- Run this in Supabase SQL Editor

-- First, let's check if the user has a profile
SELECT 
  u.id,
  u.email,
  u.is_anonymous,
  p.id as profile_id,
  p.free_credits
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = 'ef4bfb00-175c-46fc-ada3-2dff04e577e5';

-- If the profile doesn't exist, create it manually
INSERT INTO public.profiles (id, email, free_credits, is_subscribed, email_verified, credits_awarded)
VALUES (
  'ef4bfb00-175c-46fc-ada3-2dff04e577e5',
  'device-668b9153d17069f2@anonymous.local',
  3,
  FALSE,
  TRUE,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  free_credits = 3,
  email_verified = TRUE,
  credits_awarded = TRUE;

-- Now update the trigger to handle future anonymous users
CREATE OR REPLACE FUNCTION public.handle_new_user_and_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is anonymous (no email or email contains 'anonymous.local')
  IF NEW.email IS NULL OR NEW.email LIKE '%@anonymous.local' OR NEW.is_anonymous = TRUE THEN
    -- Anonymous user - give 3 free credits immediately
    INSERT INTO public.profiles (id, email, free_credits, is_subscribed, email_verified, credits_awarded)
    VALUES (
      NEW.id, 
      COALESCE(NEW.email, 'anonymous-' || NEW.id || '@anonymous.local'),
      3, 
      FALSE, 
      TRUE,  -- Anonymous users are "verified" by default
      TRUE   -- Credits already awarded
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Regular user with email - start with 0 credits, award after verification
    INSERT INTO public.profiles (id, email, free_credits, is_subscribed, email_verified, credits_awarded)
    VALUES (NEW.id, NEW.email, 0, FALSE, FALSE, FALSE)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_and_credits();

-- Verify the profile was created
SELECT 
  u.id,
  u.email,
  u.is_anonymous,
  p.free_credits,
  p.is_subscribed,
  p.email_verified
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = 'ef4bfb00-175c-46fc-ada3-2dff04e577e5';

