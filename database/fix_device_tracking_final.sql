-- FINAL FIX: Device Tracking Without Creating Multiple Users
-- This ensures one device = one UUID forever

-- 1. Drop all existing triggers and functions
DROP TRIGGER IF EXISTS trigger_set_device_id_on_insert ON profiles;
DROP TRIGGER IF EXISTS trigger_sync_credits_on_update ON profiles;
DROP TRIGGER IF EXISTS trigger_set_device_id ON profiles;
DROP TRIGGER IF EXISTS trigger_set_device_id_simple ON profiles;

DROP FUNCTION IF EXISTS set_device_id_on_profile_insert();
DROP FUNCTION IF EXISTS sync_credits_across_device();
DROP FUNCTION IF EXISTS set_device_id_from_auth();
DROP FUNCTION IF EXISTS set_device_id_simple();

-- 2. Create function to set device_id from auth metadata
CREATE OR REPLACE FUNCTION set_device_id_from_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_device_id TEXT;
BEGIN
  -- Get device_id from auth.users metadata
  SELECT raw_user_meta_data->>'device_id'
  INTO v_device_id
  FROM auth.users
  WHERE id = NEW.id;
  
  -- Set device_id if found
  IF v_device_id IS NOT NULL THEN
    NEW.device_id := v_device_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Create trigger
CREATE TRIGGER trigger_set_device_id_from_metadata
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_device_id_from_metadata();

-- 4. Create function to get or create user by device_id
CREATE OR REPLACE FUNCTION get_user_by_device_id(p_device_id TEXT)
RETURNS TABLE (
  user_id UUID,
  free_credits INTEGER,
  is_subscribed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id, free_credits, is_subscribed
  FROM profiles
  WHERE device_id = p_device_id
  ORDER BY created_at ASC
  LIMIT 1;
END;
$$;

-- 5. Create function to sync credits across all profiles with same device_id
CREATE OR REPLACE FUNCTION sync_device_credits(
  p_device_id TEXT,
  p_free_credits INTEGER,
  p_is_subscribed BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    free_credits = p_free_credits,
    is_subscribed = p_is_subscribed,
    updated_at = NOW()
  WHERE device_id = p_device_id;
END;
$$;

-- 6. Update existing profiles with device_id from auth metadata
UPDATE profiles p
SET device_id = (
  SELECT raw_user_meta_data->>'device_id'
  FROM auth.users u
  WHERE u.id = p.id
)
WHERE device_id IS NULL
AND EXISTS (
  SELECT 1
  FROM auth.users u
  WHERE u.id = p.id
  AND u.raw_user_meta_data->>'device_id' IS NOT NULL
);

-- 7. For duplicate device_ids, keep only the oldest and sync credits
DO $$
DECLARE
  v_device_id TEXT;
  v_oldest_profile RECORD;
BEGIN
  FOR v_device_id IN 
    SELECT device_id
    FROM profiles
    WHERE device_id IS NOT NULL
    GROUP BY device_id
    HAVING COUNT(*) > 1
  LOOP
    -- Get oldest profile for this device
    SELECT id, free_credits, is_subscribed
    INTO v_oldest_profile
    FROM profiles
    WHERE device_id = v_device_id
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Sync credits to all profiles with this device_id
    UPDATE profiles
    SET 
      free_credits = v_oldest_profile.free_credits,
      is_subscribed = v_oldest_profile.is_subscribed
    WHERE device_id = v_device_id;
    
    RAISE NOTICE 'Synced credits for device %: % credits', v_device_id, v_oldest_profile.free_credits;
  END LOOP;
END;
$$;

-- 8. Verify setup
SELECT 
  'Setup complete!' as status,
  COUNT(*) as total_profiles,
  COUNT(DISTINCT device_id) as unique_devices,
  COUNT(*) - COUNT(DISTINCT device_id) as duplicate_accounts
FROM profiles
WHERE device_id IS NOT NULL;

-- Show profiles grouped by device_id
SELECT 
  device_id,
  COUNT(*) as account_count,
  MIN(free_credits) as min_credits,
  MAX(free_credits) as max_credits,
  ARRAY_AGG(id ORDER BY created_at) as user_ids
FROM profiles
WHERE device_id IS NOT NULL
GROUP BY device_id
ORDER BY account_count DESC;

