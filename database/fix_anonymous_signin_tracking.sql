-- Fix anonymous user sign-in tracking
-- This ensures "last_sign_in_at" updates for anonymous users
-- Run this in Supabase SQL Editor

-- Update existing anonymous users to be "confirmed"
-- Note: confirmed_at is auto-generated from email_confirmed_at
UPDATE auth.users
SET email_confirmed_at = created_at
WHERE (is_anonymous = TRUE OR email LIKE '%@anonymous.local')
  AND email_confirmed_at IS NULL;

-- Update the trigger to auto-confirm anonymous users
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
    
    -- Mark anonymous user as confirmed in auth.users so last_sign_in_at tracks properly
    -- Note: confirmed_at is auto-generated from email_confirmed_at
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id;
    
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

-- Verify the fix
SELECT 
  id,
  email,
  is_anonymous,
  email_confirmed_at,
  confirmed_at,
  last_sign_in_at,
  created_at
FROM auth.users
WHERE is_anonymous = TRUE OR email LIKE '%@anonymous.local'
ORDER BY created_at DESC;

