-- =====================================================
-- FIX TRIGGER FUNCTION TO USE 5 FREE CREDITS
-- Run this in Supabase SQL Editor
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_device_id TEXT;
  v_existing_profile RECORD;
  v_free_credits INTEGER;
BEGIN
  v_device_id := NEW.raw_user_meta_data->>'device_id';
  v_free_credits := 5;  -- ✅ CHANGED FROM 3 TO 5
  
  IF v_device_id IS NOT NULL THEN
    SELECT free_credits INTO v_free_credits
    FROM public.profiles
    WHERE device_id = v_device_id
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  INSERT INTO public.profiles (id, email, device_id, free_credits, email_verified, credits_awarded)
  VALUES (NEW.id, NEW.email, v_device_id, COALESCE(v_free_credits, 5), TRUE, TRUE);  -- ✅ CHANGED FROM 3 TO 5
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was updated
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

