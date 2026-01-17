-- =====================================================
-- UPDATE DEFAULT FREE CREDITS FROM 5 TO 2
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Update the default value for free_credits column
ALTER TABLE profiles 
ALTER COLUMN free_credits SET DEFAULT 2;

-- Step 2: Update the trigger function to use 2 credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_device_id TEXT;
  v_existing_profile RECORD;
  v_free_credits INTEGER;
BEGIN
  v_device_id := NEW.raw_user_meta_data->>'device_id';
  v_free_credits := 2;  -- ✅ CHANGED FROM 5 TO 2
  
  IF v_device_id IS NOT NULL THEN
    SELECT free_credits INTO v_free_credits
    FROM public.profiles
    WHERE device_id = v_device_id
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  INSERT INTO public.profiles (id, email, device_id, free_credits, email_verified, credits_awarded)
  VALUES (NEW.id, NEW.email, v_device_id, COALESCE(v_free_credits, 2), TRUE, TRUE);  -- ✅ CHANGED FROM 5 TO 2
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Verify the changes
SELECT 
  table_name,
  column_name,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'free_credits';

-- Expected result: column_default should be '2'
