-- Simple trigger to set device_id from auth metadata when profile is created
-- This works with the backend device tracking logic

-- 1. Create function to set device_id from auth metadata
CREATE OR REPLACE FUNCTION set_device_id_on_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_device_id TEXT;
BEGIN
  -- Only set device_id if it's not already set
  IF NEW.device_id IS NULL THEN
    -- Get device_id from auth.users metadata
    SELECT raw_user_meta_data->>'device_id'
    INTO v_device_id
    FROM auth.users
    WHERE id = NEW.id;
    
    -- Set device_id if found
    IF v_device_id IS NOT NULL THEN
      NEW.device_id := v_device_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Create trigger
DROP TRIGGER IF EXISTS trigger_set_device_id_on_insert ON profiles;
CREATE TRIGGER trigger_set_device_id_on_insert
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_device_id_on_profile_insert();

-- 3. Update existing profiles that don't have device_id
UPDATE profiles p
SET device_id = (
  SELECT raw_user_meta_data->>'device_id'
  FROM auth.users u
  WHERE u.id = p.id
)
WHERE p.device_id IS NULL
  AND EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = p.id 
      AND u.raw_user_meta_data->>'device_id' IS NOT NULL
  );

-- 4. Verify the trigger
SELECT 
  'Trigger created successfully' as status,
  tgname as trigger_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'trigger_set_device_id_on_insert';

-- 5. Check updated profiles
SELECT 
  id,
  email,
  device_id,
  free_credits,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

