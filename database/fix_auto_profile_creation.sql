-- ============================================
-- FIX AUTO PROFILE CREATION WITH DEVICE TRACKING
-- ============================================
-- This updates the trigger that auto-creates profiles
-- to check for existing device_ids and copy credits
-- ============================================

-- Step 1: Find and replace the existing profile creation trigger
-- First, let's see what we have:
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users'
ORDER BY trigger_name;

-- Step 2: Drop the old trigger (if it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Create new function that checks device_id before creating profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device_id TEXT;
  v_existing_profile RECORD;
  v_free_credits INTEGER;
  v_is_subscribed BOOLEAN;
BEGIN
  -- Get device_id from user metadata
  v_device_id := NEW.raw_user_meta_data->>'device_id';
  
  -- Default values for new devices
  v_free_credits := 3;
  v_is_subscribed := FALSE;
  
  -- If device_id exists, check for existing profiles
  IF v_device_id IS NOT NULL THEN
    -- Look for oldest profile with this device_id
    SELECT id, free_credits, is_subscribed
    INTO v_existing_profile
    FROM public.profiles
    WHERE device_id = v_device_id
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- If found, copy credits from existing profile
    IF v_existing_profile.id IS NOT NULL THEN
      v_free_credits := v_existing_profile.free_credits;
      v_is_subscribed := v_existing_profile.is_subscribed;
      
      RAISE NOTICE 'Device % already exists, copying % credits from user %', 
        v_device_id, v_free_credits, v_existing_profile.id;
    ELSE
      RAISE NOTICE 'New device %, giving 3 credits', v_device_id;
    END IF;
  END IF;
  
  -- Create profile with appropriate credits
  INSERT INTO public.profiles (
    id,
    email,
    device_id,
    free_credits,
    is_subscribed,
    email_verified,
    credits_awarded,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_device_id,
    v_free_credits,
    v_is_subscribed,
    NEW.email_confirmed_at IS NOT NULL,
    TRUE,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Step 4: Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 5: Also update the simple device_id setter to not interfere
DROP TRIGGER IF EXISTS trigger_set_device_id_only ON public.profiles;
DROP FUNCTION IF EXISTS set_device_id_only();

-- We don't need the device_id setter anymore since handle_new_user() does it

-- Step 6: Verify setup
SELECT 
  '✅ Trigger updated!' as status,
  COUNT(*) as total_profiles,
  COUNT(DISTINCT device_id) as unique_devices
FROM public.profiles
WHERE device_id IS NOT NULL;

-- Step 7: Show current profiles
SELECT 
  SUBSTRING(id::TEXT, 1, 8) as user_id,
  device_id,
  free_credits,
  is_subscribed,
  created_at
FROM public.profiles
WHERE device_id IS NOT NULL
ORDER BY device_id, created_at;

