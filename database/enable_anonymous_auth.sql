-- Enable anonymous sign-in in Supabase
-- This allows users to have a Supabase user ID without email/password
-- Run this in Supabase SQL Editor

-- Update the handle_new_user_and_credits function to support anonymous users
CREATE OR REPLACE FUNCTION public.handle_new_user_and_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is anonymous (no email or email contains 'anonymous.local')
  IF NEW.email IS NULL OR NEW.email LIKE '%@anonymous.local' THEN
    -- Anonymous user - give 3 free credits immediately
    INSERT INTO public.profiles (id, email, free_credits, is_subscribed, email_verified, credits_awarded)
    VALUES (
      NEW.id, 
      COALESCE(NEW.email, 'anonymous-' || NEW.id || '@anonymous.local'),
      3, 
      FALSE, 
      TRUE,  -- Anonymous users are "verified" by default
      TRUE   -- Credits already awarded
    );
  ELSE
    -- Regular user with email - start with 0 credits, award after verification
    INSERT INTO public.profiles (id, email, free_credits, is_subscribed, email_verified, credits_awarded)
    VALUES (NEW.id, NEW.email, 0, FALSE, FALSE, FALSE);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (in case it needs updating)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_and_credits();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Note: You also need to enable "Anonymous sign-ins" in Supabase Dashboard:
-- 1. Go to Authentication > Providers
-- 2. Find "Anonymous" provider
-- 3. Enable it
-- 4. Save changes

