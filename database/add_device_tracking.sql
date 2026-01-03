-- Add device_id tracking to prevent credit exploitation
-- This prevents users from clearing app data and getting 3 free credits again

-- 1. Add device_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- 2. Update existing profiles to set device_id from auth.users metadata FIRST
-- This is done before adding unique constraint
DO $$
DECLARE
  r RECORD;
  v_device_id TEXT;
BEGIN
  FOR r IN 
    SELECT id FROM profiles WHERE device_id IS NULL
  LOOP
    -- Try to get device_id from auth.users metadata
    SELECT raw_user_meta_data->>'device_id' 
    INTO v_device_id
    FROM auth.users 
    WHERE id = r.id;
    
    -- Update profile if device_id found (ignore duplicates for now)
    IF v_device_id IS NOT NULL THEN
      BEGIN
        UPDATE profiles 
        SET device_id = v_device_id 
        WHERE id = r.id;
      EXCEPTION
        WHEN OTHERS THEN
          -- Ignore errors, we'll clean up duplicates next
          NULL;
      END;
    END IF;
  END LOOP;
END $$;

-- 3. Clean up duplicate device_ids before adding unique constraint
-- Keep the oldest account for each device_id, zero out credits for duplicates
DO $$
DECLARE
  r RECORD;
  v_oldest_id UUID;
BEGIN
  -- Find all device_ids that have duplicates
  FOR r IN 
    SELECT device_id, COUNT(*) as count
    FROM profiles
    WHERE device_id IS NOT NULL
    GROUP BY device_id
    HAVING COUNT(*) > 1
  LOOP
    -- Get the oldest profile with this device_id
    SELECT id INTO v_oldest_id
    FROM profiles
    WHERE device_id = r.device_id
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Zero out credits for all duplicates except the oldest
    UPDATE profiles
    SET free_credits = 0,
        device_id = NULL  -- Remove device_id from duplicates
    WHERE device_id = r.device_id
      AND id != v_oldest_id;
    
    RAISE NOTICE 'Cleaned up % duplicate accounts for device_id: %', r.count - 1, r.device_id;
  END LOOP;
END $$;

-- 4. Create index for fast device_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON profiles(device_id);

-- 5. Add unique constraint to prevent duplicate device_ids
-- Note: This allows NULL values (for old users without device_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_device_id_unique 
ON profiles(device_id) 
WHERE device_id IS NOT NULL;

-- 6. Function to check if device has already been used
CREATE OR REPLACE FUNCTION check_device_used(p_device_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE device_id = p_device_id
  );
END;
$$;

-- 7. Function to get or create profile with device tracking
CREATE OR REPLACE FUNCTION get_or_create_profile_with_device(
  p_user_id UUID,
  p_email TEXT,
  p_device_id TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  free_credits INTEGER,
  is_subscribed BOOLEAN,
  device_id TEXT,
  is_new_device BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_device_exists BOOLEAN;
  v_profile_exists BOOLEAN;
BEGIN
  -- Check if device_id already exists
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE device_id = p_device_id
  ) INTO v_device_exists;
  
  -- Check if profile exists for this user
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = p_user_id
  ) INTO v_profile_exists;
  
  -- If profile doesn't exist, create it
  IF NOT v_profile_exists THEN
    -- If device was already used, give 0 credits
    IF v_device_exists THEN
      INSERT INTO profiles (id, email, free_credits, is_subscribed, device_id)
      VALUES (p_user_id, p_email, 0, false, p_device_id)
      ON CONFLICT (id) DO NOTHING;
      
      RETURN QUERY
      SELECT p.id, p.email, p.free_credits, p.is_subscribed, p.device_id, false as is_new_device
      FROM profiles p
      WHERE p.id = p_user_id;
    ELSE
      -- New device, give 3 free credits
      INSERT INTO profiles (id, email, free_credits, is_subscribed, device_id)
      VALUES (p_user_id, p_email, 3, false, p_device_id)
      ON CONFLICT (id) DO NOTHING;
      
      RETURN QUERY
      SELECT p.id, p.email, p.free_credits, p.is_subscribed, p.device_id, true as is_new_device
      FROM profiles p
      WHERE p.id = p_user_id;
    END IF;
  ELSE
    -- Profile exists, just return it
    RETURN QUERY
    SELECT p.id, p.email, p.free_credits, p.is_subscribed, p.device_id, false as is_new_device
    FROM profiles p
    WHERE p.id = p_user_id;
  END IF;
END;
$$;

-- 8. Create trigger to automatically set device_id from auth metadata on new profiles
CREATE OR REPLACE FUNCTION set_device_id_from_auth()
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
  
  -- Check if device_id already exists in another profile
  IF v_device_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE device_id = v_device_id AND id != NEW.id
    ) INTO v_device_exists;
    
    -- If device already used, don't set device_id and give 0 credits
    IF v_device_exists THEN
      NEW.device_id := NULL;
      NEW.free_credits := 0;
      RAISE NOTICE 'Device % already used, setting credits to 0', v_device_id;
    ELSE
      -- New device, set device_id
      IF NEW.device_id IS NULL THEN
        NEW.device_id := v_device_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_set_device_id ON profiles;
CREATE TRIGGER trigger_set_device_id
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_device_id_from_auth();

COMMENT ON COLUMN profiles.device_id IS 'Hardware device ID to prevent credit exploitation by clearing app data';
COMMENT ON FUNCTION check_device_used(TEXT) IS 'Check if a device has already been used to claim free credits';
COMMENT ON FUNCTION get_or_create_profile_with_device(UUID, TEXT, TEXT) IS 'Get or create profile with device tracking - prevents credit exploitation';

