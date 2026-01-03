-- Fix the database error when creating anonymous users
-- This removes the unique constraint and handles duplicates in the trigger instead

-- 1. Drop the unique constraint (it's causing the error)
DROP INDEX IF EXISTS idx_profiles_device_id_unique;

-- 2. Keep the regular index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON profiles(device_id);

-- 3. Update the trigger to handle duplicates WITHOUT the unique constraint
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
      RAISE NOTICE 'Device % already used, setting credits to 0 for user %', v_device_id, NEW.id;
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

-- 4. Verify the trigger is attached
DROP TRIGGER IF EXISTS trigger_set_device_id ON profiles;
CREATE TRIGGER trigger_set_device_id
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_device_id_from_auth();

-- 5. Test query to verify setup
SELECT 
  'Trigger exists' as status,
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'trigger_set_device_id';

