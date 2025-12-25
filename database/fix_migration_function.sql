-- Fix the migrate_guest_to_user function to remove updated_at reference
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION migrate_guest_to_user(
  p_device_id TEXT,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_guest_credits INTEGER;
  v_user_credits INTEGER;
BEGIN
  -- Get guest credits
  SELECT free_credits INTO v_guest_credits
  FROM guest_profiles
  WHERE device_id = p_device_id;
  
  -- Get current user credits
  SELECT free_credits INTO v_user_credits
  FROM profiles
  WHERE id = p_user_id;
  
  -- Add guest credits to user credits (if guest has remaining credits)
  IF v_guest_credits IS NOT NULL AND v_guest_credits > 0 THEN
    UPDATE profiles
    SET free_credits = COALESCE(v_user_credits, 0) + v_guest_credits
    WHERE id = p_user_id;
  END IF;
  
  -- Transfer all generations from guest to user (REMOVED updated_at)
  UPDATE generations
  SET 
    user_id = p_user_id,
    guest_device_id = NULL
  WHERE guest_device_id = p_device_id;
  
  -- Delete guest profile after migration
  DELETE FROM guest_profiles WHERE device_id = p_device_id;
  
  -- Log the migration
  RAISE NOTICE 'Migrated guest data from device % to user % (credits: %)', p_device_id, p_user_id, v_guest_credits;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION migrate_guest_to_user(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_guest_to_user(TEXT, UUID) TO service_role;

