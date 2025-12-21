-- AI Portrait Generator Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  free_credits INTEGER DEFAULT 3,
  is_subscribed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Generations table
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  style_key TEXT NOT NULL,
  original_image_url TEXT,
  generated_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);

-- Function to decrement credits
CREATE OR REPLACE FUNCTION decrement_credits(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  UPDATE profiles 
  SET free_credits = GREATEST(free_credits - 1, 0),
      updated_at = NOW()
  WHERE id = user_id
  RETURNING free_credits INTO current_credits;
  
  RETURN current_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, free_credits, is_subscribed)
  VALUES (NEW.id, NEW.email, 3, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies for generations
CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
  ON generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations"
  ON generations FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- GUEST USER SUPPORT
-- =============================================

-- Guest profiles table for anonymous users
CREATE TABLE guest_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT UNIQUE NOT NULL,
  free_credits INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add guest_device_id column to generations for guest users
ALTER TABLE generations 
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN guest_device_id TEXT;

-- Create index for guest device ID lookups
CREATE INDEX idx_generations_guest_device_id ON generations(guest_device_id);
CREATE INDEX idx_guest_profiles_device_id ON guest_profiles(device_id);

-- Function to decrement guest credits
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

-- Function to migrate guest data to user account
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

-- RLS for guest_profiles (service role only - no auth.uid for guests)
ALTER TABLE guest_profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role full access to guest_profiles
CREATE POLICY "Service role full access to guest_profiles"
  ON guest_profiles
  USING (true)
  WITH CHECK (true);

-- Update generations policy to allow guest access
DROP POLICY IF EXISTS "Users can view own generations" ON generations;
DROP POLICY IF EXISTS "Users can insert own generations" ON generations;
DROP POLICY IF EXISTS "Users can update own generations" ON generations;

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

-- =============================================
-- STORAGE CONFIGURATION
-- =============================================

-- Storage bucket for portraits
-- Run this separately in Supabase Dashboard > Storage
-- CREATE BUCKET portraits WITH (public = true);

-- Storage policy (run in SQL editor after creating bucket)
-- CREATE POLICY "Users can upload own portraits"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'portraits' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Anyone can view portraits"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'portraits');

