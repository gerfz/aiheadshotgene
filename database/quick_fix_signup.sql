-- QUICK FIX: Run this immediately to fix signup errors
-- This restores the original behavior while adding the new columns

-- Add the new columns (safe to run even if they exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS credits_awarded BOOLEAN DEFAULT TRUE;

-- Update the trigger function to work with or without new columns
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile with 3 credits (for now, until you're ready to enforce verification)
  INSERT INTO profiles (id, email, free_credits, is_subscribed, email_verified, credits_awarded)
  VALUES (NEW.id, NEW.email, 3, FALSE, TRUE, TRUE)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update any existing users that might have null values
UPDATE profiles 
SET 
  email_verified = COALESCE(email_verified, TRUE),
  credits_awarded = COALESCE(credits_awarded, TRUE)
WHERE email_verified IS NULL OR credits_awarded IS NULL;

