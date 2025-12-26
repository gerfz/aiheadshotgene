-- Clean setup for anonymous authentication
-- Run this in Supabase SQL Editor

-- Step 1: Update the trigger to handle anonymous users properly
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
    )e 
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

-- Step 2: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_and_credits();

-- Step 3: Verify the trigger is set up
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Done! Now restart your app and it will create a new anonymous user with a profile automatically.

