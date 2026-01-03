-- Merge accounts by device_id - new users with same device_id use the original account's credits
-- This prevents exploitation while preserving the user's remaining credits

CREATE OR REPLACE FUNCTION set_device_id_on_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_device_id TEXT;
  v_existing_profile RECORD;
BEGIN
  -- Get device_id from auth.users metadata
  SELECT raw_user_meta_data->>'device_id'
  INTO v_device_id
  FROM auth.users
  WHERE id = NEW.id;
  
  -- If device_id found, check if it's already been used
  IF v_device_id IS NOT NULL THEN
    -- Look for existing profile with this device_id
    SELECT id, free_credits, is_subscribed
    INTO v_existing_profile
    FROM profiles 
    WHERE device_id = v_device_id 
      AND id != NEW.id
    ORDER BY created_at ASC  -- Get the oldest (original) account
    LIMIT 1;
    
    -- Set device_id
    NEW.device_id := v_device_id;
    
    -- If device already used, copy credits from original account
    IF v_existing_profile.id IS NOT NULL THEN
      NEW.free_credits := v_existing_profile.free_credits;
      NEW.is_subscribed := v_existing_profile.is_subscribed;
      RAISE NOTICE 'Device % already used by %, copying % credits to new user %', 
        v_device_id, v_existing_profile.id, v_existing_profile.free_credits, NEW.id;
    ELSE
      -- New device, give 3 credits
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

-- Also need a trigger to sync credits when they're used
-- When credits are updated on ANY profile with a device_id, update ALL profiles with same device_id
CREATE OR REPLACE FUNCTION sync_credits_across_device()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If device_id exists and credits changed, sync to all profiles with same device_id
  IF NEW.device_id IS NOT NULL AND (NEW.free_credits != OLD.free_credits OR NEW.is_subscribed != OLD.is_subscribed) THEN
    UPDATE profiles
    SET 
      free_credits = NEW.free_credits,
      is_subscribed = NEW.is_subscribed,
      updated_at = NOW()
    WHERE device_id = NEW.device_id
      AND id != NEW.id;
    
    RAISE NOTICE 'Synced credits (%) for device % to % other profiles', 
      NEW.free_credits, NEW.device_id, (SELECT COUNT(*) FROM profiles WHERE device_id = NEW.device_id AND id != NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for credit sync
DROP TRIGGER IF EXISTS trigger_sync_credits_on_update ON profiles;
CREATE TRIGGER trigger_sync_credits_on_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_credits_across_device();

-- Test: Show current profiles
SELECT 
  id,
  SUBSTRING(email, 1, 40) as email,
  device_id,
  free_credits,
  is_subscribed,
  created_at
FROM profiles
ORDER BY device_id, created_at
LIMIT 10;

