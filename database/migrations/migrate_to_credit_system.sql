-- Migration: Migrate Existing Users to Credit System
-- Description: Converts existing free_credits to new total_credits system
-- Date: 2026-01-24
-- IMPORTANT: Run this AFTER add_credit_system.sql

-- Migrate existing subscribed users
-- Give them 3000 credits to start with
UPDATE profiles 
SET total_credits = 3000 
WHERE is_subscribed = true AND total_credits = 0;

-- Migrate existing users with free credits
-- Convert free_credits to total_credits (multiply by 200 to match new cost structure)
-- Old system: 1 credit = 1 generation
-- New system: 1 generation = 200 credits
-- So 5 free credits = 1000 total credits
UPDATE profiles 
SET total_credits = free_credits * 200 
WHERE is_subscribed = false AND free_credits > 0 AND total_credits = 0;

-- For users with no credits and no subscription, give them trial option
-- Mark them as eligible for trial (they'll get it on next app open)
-- We don't auto-start trial here to avoid starting trials for inactive users
UPDATE profiles 
SET total_credits = 0
WHERE is_subscribed = false 
  AND free_credits = 0 
  AND total_credits = 0
  AND is_trial_active = false
  AND trial_start_date IS NULL;

-- Drop the old decrement function first to avoid conflicts
DROP FUNCTION IF EXISTS decrement_user_credits(UUID);

-- Update the old decrement function to call the new one
-- This ensures backward compatibility if any code still calls the old function
CREATE OR REPLACE FUNCTION decrement_user_credits(user_id UUID)
RETURNS TABLE(success BOOLEAN, remaining_credits INTEGER) AS $$
BEGIN
  -- Call new function with 200 credit cost (default generation cost)
  RETURN QUERY SELECT * FROM decrement_user_credits_v2(user_id, 200);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a view for easy credit status checking
CREATE OR REPLACE VIEW user_credit_status AS
SELECT 
  id,
  total_credits,
  is_subscribed,
  is_trial_active,
  trial_end_date,
  CASE 
    WHEN is_subscribed THEN 'subscribed'
    WHEN is_trial_active AND trial_end_date > NOW() THEN 'trial'
    WHEN total_credits > 0 THEN 'credits'
    ELSE 'none'
  END as credit_status,
  CASE
    WHEN is_subscribed THEN true
    WHEN is_trial_active AND trial_end_date > NOW() THEN true
    WHEN total_credits >= 200 THEN true
    ELSE false
  END as can_generate,
  CASE
    WHEN is_subscribed THEN true
    WHEN is_trial_active AND trial_end_date > NOW() THEN true
    WHEN total_credits >= 50 THEN true
    ELSE false
  END as can_edit,
  FLOOR(total_credits / 200) as generations_remaining,
  FLOOR(total_credits / 50) as edits_remaining
FROM profiles;

-- Grant access to the view
GRANT SELECT ON user_credit_status TO authenticated;

-- Log migration completion
DO $$
DECLARE
  subscribed_count INTEGER;
  credit_users INTEGER;
  zero_credit_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO subscribed_count FROM profiles WHERE is_subscribed = true;
  SELECT COUNT(*) INTO credit_users FROM profiles WHERE total_credits > 0 AND NOT is_subscribed;
  SELECT COUNT(*) INTO zero_credit_users FROM profiles WHERE total_credits = 0 AND NOT is_subscribed;
  
  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - Subscribed users: %', subscribed_count;
  RAISE NOTICE '  - Users with credits: %', credit_users;
  RAISE NOTICE '  - Users with no credits: %', zero_credit_users;
END $$;
