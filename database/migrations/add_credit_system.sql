-- Migration: Add Credit System to Profiles
-- Description: Adds columns for credit-based system with trial support
-- Date: 2026-01-24

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credits_per_week INTEGER DEFAULT 3000;

-- Create index for trial queries
CREATE INDEX IF NOT EXISTS idx_profiles_trial_active ON profiles(is_trial_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end_date ON profiles(trial_end_date);

-- Update credit deduction function to use new credit system
-- This function deducts a specific cost (200 for generation, 50 for edit)
CREATE OR REPLACE FUNCTION decrement_user_credits_v2(user_id UUID, cost INTEGER)
RETURNS TABLE(success BOOLEAN, remaining_credits INTEGER) AS $$
DECLARE
  current_credits INTEGER;
  user_subscribed BOOLEAN;
BEGIN
  -- Lock the row for update
  SELECT total_credits, is_subscribed 
  INTO current_credits, user_subscribed
  FROM profiles 
  WHERE id = user_id 
  FOR UPDATE;
  
  -- If user is subscribed, they have unlimited generations (credits managed separately)
  -- But we still track their credit balance for when subscription ends
  IF user_subscribed THEN
    -- Subscribed users can generate regardless of credit balance
    -- But we still deduct to track usage
    UPDATE profiles 
    SET total_credits = GREATEST(0, total_credits - cost)
    WHERE id = user_id;
    
    RETURN QUERY SELECT true, GREATEST(0, current_credits - cost);
  ELSE
    -- Non-subscribed users need sufficient credits
    IF current_credits >= cost THEN
      UPDATE profiles 
      SET total_credits = total_credits - cost 
      WHERE id = user_id;
      
      RETURN QUERY SELECT true, (current_credits - cost);
    ELSE
      -- Insufficient credits
      RETURN QUERY SELECT false, current_credits;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (for purchases or renewals)
CREATE OR REPLACE FUNCTION add_user_credits(user_id UUID, credits_to_add INTEGER)
RETURNS TABLE(success BOOLEAN, new_total INTEGER) AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  UPDATE profiles 
  SET total_credits = total_credits + credits_to_add
  WHERE id = user_id
  RETURNING total_credits INTO new_credits;
  
  IF FOUND THEN
    RETURN QUERY SELECT true, new_credits;
  ELSE
    RETURN QUERY SELECT false, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start trial for a user
CREATE OR REPLACE FUNCTION start_user_trial(user_id UUID, trial_credits INTEGER DEFAULT 1000)
RETURNS TABLE(success BOOLEAN, trial_ends TIMESTAMP) AS $$
DECLARE
  trial_end TIMESTAMP;
BEGIN
  trial_end := NOW() + INTERVAL '3 days';
  
  UPDATE profiles 
  SET 
    is_trial_active = true,
    trial_start_date = NOW(),
    trial_end_date = trial_end,
    total_credits = total_credits + trial_credits
  WHERE id = user_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT true, trial_end;
  ELSE
    RETURN QUERY SELECT false, NULL::TIMESTAMP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert trial to subscription
CREATE OR REPLACE FUNCTION convert_trial_to_subscription(user_id UUID, additional_credits INTEGER DEFAULT 2000)
RETURNS TABLE(success BOOLEAN) AS $$
BEGIN
  UPDATE profiles 
  SET 
    is_trial_active = false,
    is_subscribed = true,
    total_credits = total_credits + additional_credits
  WHERE id = user_id;
  
  RETURN QUERY SELECT FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add weekly credits for subscribed users
CREATE OR REPLACE FUNCTION add_weekly_credits(user_id UUID)
RETURNS TABLE(success BOOLEAN, new_total INTEGER) AS $$
DECLARE
  credits_to_add INTEGER;
  new_credits INTEGER;
BEGIN
  SELECT credits_per_week INTO credits_to_add FROM profiles WHERE id = user_id;
  
  UPDATE profiles 
  SET total_credits = total_credits + credits_to_add
  WHERE id = user_id AND is_subscribed = true
  RETURNING total_credits INTO new_credits;
  
  IF FOUND THEN
    RETURN QUERY SELECT true, new_credits;
  ELSE
    RETURN QUERY SELECT false, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and expire trials
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE profiles 
  SET is_trial_active = false
  WHERE is_trial_active = true 
    AND trial_end_date < NOW()
    AND NOT is_subscribed;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION decrement_user_credits_v2(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION start_user_trial(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION convert_trial_to_subscription(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_weekly_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_trials() TO authenticated;

-- Add comment
COMMENT ON COLUMN profiles.total_credits IS 'Total credits available for generations and edits';
COMMENT ON COLUMN profiles.trial_start_date IS 'When the 3-day trial started';
COMMENT ON COLUMN profiles.trial_end_date IS 'When the 3-day trial ends';
COMMENT ON COLUMN profiles.is_trial_active IS 'Whether user is currently in trial period';
COMMENT ON COLUMN profiles.credits_per_week IS 'Credits added per week for subscribed users';
