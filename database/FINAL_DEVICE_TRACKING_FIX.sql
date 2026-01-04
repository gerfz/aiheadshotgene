-- ============================================
-- FINAL DEVICE TRACKING FIX
-- ============================================
-- This script:
-- 1. Removes ALL triggers that cause database errors
-- 2. Sets up simple device_id tracking
-- 3. Lets the backend handle credit merging and syncing
-- ============================================

-- Step 1: Drop ALL existing triggers
DROP TRIGGER IF EXISTS trigger_set_device_id_on_insert ON profiles;
DROP TRIGGER IF EXISTS trigger_sync_credits_on_update ON profiles;
DROP TRIGGER IF EXISTS trigger_set_device_id ON profiles;
DROP TRIGGER IF EXISTS trigger_set_device_id_simple ON profiles;
DROP TRIGGER IF EXISTS trigger_set_device_id_from_metadata ON profiles;

-- Step 2: Drop ALL existing functions
DROP FUNCTION IF EXISTS set_device_id_on_profile_insert();
DROP FUNCTION IF EXISTS sync_credits_across_device();
DROP FUNCTION IF EXISTS set_device_id_from_auth();
DROP FUNCTION IF EXISTS set_device_id_simple();
DROP FUNCTION IF EXISTS set_device_id_from_metadata();

-- Step 3: Create SIMPLE function that only sets device_id (no credit logic!)
CREATE OR REPLACE FUNCTION set_device_id_only()
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
      RAISE NOTICE 'Set device_id % for user %', v_device_id, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 4: Create simple trigger (BEFORE INSERT only, no UPDATE trigger!)
CREATE TRIGGER trigger_set_device_id_only
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_device_id_only();

-- Step 5: Update existing profiles with device_id from auth metadata
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

-- Step 6: Sync credits for duplicate device_ids (keep oldest account's credits)
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
    
    RAISE NOTICE 'Synced % credits for device %', v_oldest_profile.free_credits, v_device_id;
  END LOOP;
END;
$$;

-- Step 7: Verify setup
SELECT 
  '✅ Setup complete!' as status,
  COUNT(*) as total_profiles,
  COUNT(DISTINCT device_id) as unique_devices,
  COUNT(*) - COUNT(DISTINCT device_id) as duplicate_accounts
FROM profiles
WHERE device_id IS NOT NULL;

-- Step 8: Show current state
SELECT 
  device_id,
  COUNT(*) as account_count,
  MIN(free_credits) as credits,
  ARRAY_AGG(SUBSTRING(id::TEXT, 1, 8) ORDER BY created_at) as user_ids_preview
FROM profiles
WHERE device_id IS NOT NULL
GROUP BY device_id
ORDER BY account_count DESC, device_id;

-- ============================================
-- HOW IT WORKS NOW:
-- ============================================
-- 1. Trigger ONLY sets device_id from auth metadata
-- 2. Backend handles ALL credit logic:
--    - When /credits is called, backend checks for existing device_id
--    - If device exists, backend copies credits from oldest account
--    - When credits are used, backend syncs to all accounts with same device_id
-- 3. No complex trigger logic = no database errors!
-- ============================================

