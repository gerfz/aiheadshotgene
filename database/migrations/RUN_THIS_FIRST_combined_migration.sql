-- =============================================
-- COMBINED CREDIT SYSTEM MIGRATION
-- Run this entire file in Supabase SQL Editor
-- =============================================

-- STEP 1: Add credit system columns and functions
-- =============================================

-- Drop existing views that depend on profiles table
DROP VIEW IF EXISTS user_credit_status;

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS credits_per_week INTEGER DEFAULT 3000;

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS decrement_user_credits_v2(UUID, INTEGER);
DROP FUNCTION IF EXISTS add_user_credits(UUID, INTEGER);
DROP FUNCTION IF EXISTS start_user_trial(UUID, INTEGER);
DROP FUNCTION IF EXISTS convert_trial_to_subscription(UUID, INTEGER);
DROP FUNCTION IF EXISTS add_weekly_credits(UUID);
DROP FUNCTION IF EXISTS expire_trials();
DROP FUNCTION IF EXISTS decrement_user_credits(UUID);

-- Create function to decrement credits with specific cost
CREATE OR REPLACE FUNCTION decrement_user_credits_v2(user_id UUID, cost INTEGER)
RETURNS TABLE(success BOOLEAN, remaining_credits INTEGER) AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT total_credits INTO current_credits
  FROM profiles
  WHERE id = user_id;
  
  -- Check if user has enough credits
  IF current_credits >= cost THEN
    -- Deduct credits
    UPDATE profiles
    SET total_credits = total_credits - cost
    WHERE id = user_id
    RETURNING total_credits INTO remaining_credits;
    
    RETURN QUERY SELECT TRUE, remaining_credits;
  ELSE
    -- Not enough credits
    RETURN QUERY SELECT FALSE, current_credits;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add credits
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
    RETURN QUERY SELECT TRUE, new_credits;
  ELSE
    RETURN QUERY SELECT FALSE, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to start user trial
CREATE OR REPLACE FUNCTION start_user_trial(user_id UUID, trial_credits INTEGER)
RETURNS TABLE(success BOOLEAN, trial_end TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  end_date := NOW() + INTERVAL '3 days';
  
  UPDATE profiles
  SET 
    is_trial_active = TRUE,
    trial_start_date = NOW(),
    trial_end_date = end_date,
    total_credits = total_credits + trial_credits
  WHERE id = user_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, end_date;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMP WITH TIME ZONE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to convert trial to subscription
CREATE OR REPLACE FUNCTION convert_trial_to_subscription(user_id UUID, additional_credits INTEGER)
RETURNS TABLE(success BOOLEAN) AS $$
BEGIN
  UPDATE profiles
  SET 
    is_trial_active = FALSE,
    is_subscribed = TRUE,
    total_credits = total_credits + additional_credits
  WHERE id = user_id;
  
  RETURN QUERY SELECT FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add weekly credits
CREATE OR REPLACE FUNCTION add_weekly_credits(user_id UUID)
RETURNS TABLE(success BOOLEAN, new_total INTEGER) AS $$
DECLARE
  weekly_amount INTEGER;
  new_credits INTEGER;
BEGIN
  -- Get the user's weekly credit amount
  SELECT credits_per_week INTO weekly_amount
  FROM profiles
  WHERE id = user_id;
  
  -- Add weekly credits
  UPDATE profiles
  SET total_credits = total_credits + weekly_amount
  WHERE id = user_id
  RETURNING total_credits INTO new_credits;
  
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, new_credits;
  ELSE
    RETURN QUERY SELECT FALSE, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to expire trials
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE profiles
  SET is_trial_active = FALSE
  WHERE is_trial_active = TRUE
    AND trial_end_date < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- STEP 2: Create credit transactions table
-- =============================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL UNIQUE,
  pack_id TEXT,
  credits_added INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'trial', 'renewal', 'bonus', 'refund')),
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own transactions
CREATE POLICY "Users can view own transactions"
  ON credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);


-- STEP 3: Migrate existing data
-- =============================================

-- Migrate subscribed users to 3000 credits
UPDATE profiles
SET total_credits = 3000
WHERE is_subscribed = TRUE 
  AND (total_credits IS NULL OR total_credits = 0);

-- Migrate free_credits to total_credits (if free_credits column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'free_credits'
  ) THEN
    -- Convert free_credits to total_credits (multiply by 200 since old system was generation-based)
    UPDATE profiles
    SET total_credits = COALESCE(free_credits, 0) * 200
    WHERE total_credits = 0 OR total_credits IS NULL;
  END IF;
END $$;

-- Drop the old decrement function first to avoid conflicts
DROP FUNCTION IF EXISTS decrement_user_credits(UUID);

-- Update the old decrement function to call the new one
CREATE OR REPLACE FUNCTION decrement_user_credits(user_id UUID)
RETURNS TABLE(success BOOLEAN, remaining_credits INTEGER) AS $$
BEGIN
  -- Call new function with 200 credit cost (default generation cost)
  RETURN QUERY SELECT * FROM decrement_user_credits_v2(user_id, 200);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for easy credit status checking
CREATE OR REPLACE VIEW user_credit_status AS
SELECT 
  id,
  email,
  total_credits,
  is_subscribed,
  is_trial_active,
  trial_end_date,
  CASE 
    WHEN is_subscribed THEN 'unlimited'
    WHEN total_credits >= 200 THEN 'can_generate'
    WHEN total_credits >= 50 THEN 'can_edit_only'
    ELSE 'no_credits'
  END as status,
  CASE
    WHEN is_trial_active AND trial_end_date > NOW() THEN 
      EXTRACT(DAY FROM (trial_end_date - NOW()))
    ELSE 0
  END as trial_days_remaining
FROM profiles;

-- =============================================
-- MIGRATION COMPLETE!
-- =============================================

-- Verify the migration
SELECT 
  'Migration Complete!' as status,
  COUNT(*) as total_users,
  SUM(total_credits) as total_credits_in_system,
  COUNT(*) FILTER (WHERE is_subscribed) as subscribed_users,
  COUNT(*) FILTER (WHERE is_trial_active) as active_trials
FROM profiles;
