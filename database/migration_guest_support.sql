-- =============================================
-- MIGRATION: Add Guest User Support
-- Run this in Supabase SQL Editor to enable guest users
-- =============================================

-- 1. Create guest_profiles table
CREATE TABLE IF NOT EXISTS guest_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT UNIQUE NOT NULL,
  free_credits INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Add guest_device_id column to generations
ALTER TABLE generations 
  ADD COLUMN IF NOT EXISTS guest_device_id TEXT;

-- 3. Make user_id nullable for guest generations
ALTER TABLE generations 
  ALTER COLUMN user_id DROP NOT NULL;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_generations_guest_device_id ON generations(guest_device_id);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_device_id ON guest_profiles(device_id);

-- 5. Function to decrement guest credits
CREATE OR REPLACE FUNCTION decrement_guest_credits(p_device_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  UPDATE guest_profiles 
  SET free_credits = GREATEST(free_credits - 1, 0),
      updated_at = NOW()
  WHERE device_id = p_device_id
  RETURNING free_credits INTO current_credits;
  
  RETURN current_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to migrate guest data to user account
CREATE OR REPLACE FUNCTION migrate_guest_to_user(p_device_id TEXT, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Transfer all generations from guest to user
  UPDATE generations 
  SET user_id = p_user_id, 
      guest_device_id = NULL
  WHERE guest_device_id = p_device_id;
  
  -- Delete the guest profile
  DELETE FROM guest_profiles WHERE device_id = p_device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Enable RLS on guest_profiles
ALTER TABLE guest_profiles ENABLE ROW LEVEL SECURITY;

-- 8. Create policy for guest_profiles (service role access)
DROP POLICY IF EXISTS "Service role full access to guest_profiles" ON guest_profiles;
CREATE POLICY "Service role full access to guest_profiles"
  ON guest_profiles
  USING (true)
  WITH CHECK (true);

-- 9. Update generations policies to support guests
DROP POLICY IF EXISTS "Users can view own generations" ON generations;
DROP POLICY IF EXISTS "Users can insert own generations" ON generations;
DROP POLICY IF EXISTS "Users can update own generations" ON generations;
DROP POLICY IF EXISTS "Users and guests can view own generations" ON generations;
DROP POLICY IF EXISTS "Users and guests can insert generations" ON generations;
DROP POLICY IF EXISTS "Users and guests can update own generations" ON generations;
DROP POLICY IF EXISTS "Users and guests can delete own generations" ON generations;

CREATE POLICY "Users and guests can view own generations"
  ON generations FOR SELECT
  USING (auth.uid() = user_id OR guest_device_id IS NOT NULL);

CREATE POLICY "Users and guests can insert generations"
  ON generations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR guest_device_id IS NOT NULL);

CREATE POLICY "Users and guests can update own generations"
  ON generations FOR UPDATE
  USING (auth.uid() = user_id OR guest_device_id IS NOT NULL);

CREATE POLICY "Users and guests can delete own generations"
  ON generations FOR DELETE
  USING (auth.uid() = user_id OR guest_device_id IS NOT NULL);

-- Done!
-- Verify with: SELECT * FROM guest_profiles LIMIT 1;

