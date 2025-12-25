-- Migration: Add email verification requirement for free credits
-- Run this in Supabase SQL Editor

-- Step 1: Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS credits_awarded BOOLEAN DEFAULT FALSE;

-- Step 2: Update existing users to be verified (so they don't lose access)
UPDATE profiles 
SET email_verified = TRUE, credits_awarded = TRUE 
WHERE created_at < NOW();

-- Step 3: Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 4: Create new function that gives 0 credits initially (awarded after verification)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile with 0 credits initially (will be awarded after email verification)
  INSERT INTO profiles (id, email, free_credits, is_subscribed, email_verified, credits_awarded)
  VALUES (NEW.id, NEW.email, 0, FALSE, FALSE, FALSE)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If columns don't exist yet, use old schema
    INSERT INTO profiles (id, email, free_credits, is_subscribed)
    VALUES (NEW.id, NEW.email, 3, FALSE)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to award credits after email verification
CREATE OR REPLACE FUNCTION award_verification_credits(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_verified BOOLEAN;
  already_awarded BOOLEAN;
BEGIN
  -- Check if user is verified and hasn't received credits yet
  SELECT 
    (SELECT email_verified FROM auth.users WHERE id = user_id),
    credits_awarded
  INTO user_verified, already_awarded
  FROM profiles
  WHERE id = user_id;
  
  -- If user is verified and hasn't received credits, award them
  IF user_verified = TRUE AND already_awarded = FALSE THEN
    UPDATE profiles 
    SET 
      free_credits = 3,
      credits_awarded = TRUE,
      email_verified = TRUE,
      updated_at = NOW()
    WHERE id = user_id;
    RETURN TRUE;
  END IF;
  
  -- If already awarded or not verified, return false
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync email verification status from auth.users
CREATE OR REPLACE FUNCTION sync_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile when email is confirmed in auth.users
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE profiles 
    SET email_verified = TRUE
    WHERE id = NEW.id;
    
    -- Award credits if not already awarded
    PERFORM award_verification_credits(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email verification
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION sync_email_verification();

-- Add comment to explain the columns
COMMENT ON COLUMN profiles.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN profiles.credits_awarded IS 'Whether the user has received their initial 3 free credits after email verification';

