-- =====================================================
-- ATOMIC CREDIT DECREMENT FUNCTION
-- Prevents race conditions when multiple requests try to
-- decrement credits simultaneously
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS decrement_user_credits(uuid);

-- Create atomic credit decrement function
CREATE OR REPLACE FUNCTION decrement_user_credits(p_user_id uuid)
RETURNS TABLE(
  success boolean,
  free_credits integer,
  message text
) AS $$
DECLARE
  v_device_id text;
  v_current_credits integer;
  v_new_credits integer;
BEGIN
  -- Get user's current credits and device_id with row lock
  SELECT p.device_id, p.free_credits 
  INTO v_device_id, v_current_credits
  FROM profiles p
  WHERE p.id = p_user_id
  FOR UPDATE; -- This locks the row until transaction completes
  
  -- Check if user was found
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'User not found'::text;
    RETURN;
  END IF;
  
  -- Check if user has credits
  IF v_current_credits <= 0 THEN
    RETURN QUERY SELECT false, 0, 'No credits remaining'::text;
    RETURN;
  END IF;
  
  -- Calculate new credits (ensure it doesn't go below 0)
  v_new_credits := GREATEST(v_current_credits - 1, 0);
  
  -- Update this user's credits atomically
  UPDATE profiles p
  SET free_credits = v_new_credits
  WHERE p.id = p_user_id;
  
  -- If user has a device_id, sync credits to all profiles with same device_id
  IF v_device_id IS NOT NULL THEN
    UPDATE profiles p
    SET free_credits = v_new_credits
    WHERE p.device_id = v_device_id
    AND p.id != p_user_id;
  END IF;
  
  -- Return success
  RETURN QUERY SELECT true, v_new_credits, 'Credits decremented successfully'::text;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION decrement_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_user_credits TO service_role;

-- Test the function (optional, comment out in production)
-- SELECT * FROM decrement_user_credits('your-test-user-id-here');

