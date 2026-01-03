-- Simple device tracking without complex triggers that cause errors
-- Just set device_id, don't check for duplicates in trigger

-- 1. Drop all existing triggers
DROP TRIGGER IF EXISTS trigger_set_device_id_on_insert ON profiles;
DROP TRIGGER IF EXISTS trigger_sync_credits_on_update ON profiles;
DROP TRIGGER IF EXISTS trigger_set_device_id ON profiles;

-- 2. Simple function that ONLY sets device_id (no duplicate checking)
CREATE OR REPLACE FUNCTION set_device_id_simple()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_device_id TEXT;
BEGIN
  -- Only set device_id if not already set
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

-- 3. Create simple trigger
CREATE TRIGGER trigger_set_device_id_simple
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_device_id_simple();

-- 4. Verify
SELECT 
  'Trigger created' as status,
  tgname as trigger_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'profiles' AND tgname = 'trigger_set_device_id_simple';

