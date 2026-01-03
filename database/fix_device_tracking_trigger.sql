-- Fix the trigger to check for duplicate device_ids and set credits to 0

CREATE OR REPLACE FUNCTION set_device_id_on_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_device_id TEXT;
  v_device_exists BOOLEAN;
BEGIN
  -- Get device_id from auth.users metadata
  SELECT raw_user_meta_data->>'device_id'
  INTO v_device_id
  FROM auth.users
  WHERE id = NEW.id;
  
  -- If device_id found, check if it's already been used
  IF v_device_id IS NOT NULL THEN
    -- Check if another profile already has this device_id
    SELECT EXISTS(
      SELECT 1 
      FROM profiles 
      WHERE device_id = v_device_id 
        AND id != NEW.id
    ) INTO v_device_exists;
    
    -- Set device_id
    NEW.device_id := v_device_id;
    
    -- If device already used, set credits to 0
    IF v_device_exists THEN
      NEW.free_credits := 0;
      RAISE NOTICE 'Device % already used by another profile, setting credits to 0 for user %', v_device_id, NEW.id;
    ELSE
      -- New device, ensure they get 3 credits if not already set
      IF NEW.free_credits IS NULL THEN
        NEW.free_credits := 3;
      END IF;
      RAISE NOTICE 'New device %, giving 3 credits to user %', v_device_id, NEW.id;
    END IF;
  ELSE
    -- No device_id in metadata, give default 3 credits
    IF NEW.free_credits IS NULL THEN
      NEW.free_credits := 3;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_set_device_id_on_insert ON profiles;
CREATE TRIGGER trigger_set_device_id_on_insert
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_device_id_on_profile_insert();

-- Test: Show current profiles
SELECT 
  id,
  SUBSTRING(email, 1, 40) as email,
  device_id,
  free_credits,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

