-- Add email column to profiles table if it doesn't exist
-- This allows users to set their contact email

-- Add email column (if not already present)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update RLS policy to allow users to update their own email
DROP POLICY IF EXISTS "Users can update own profile email" ON public.profiles;

CREATE POLICY "Users can update own profile email"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT UPDATE (email) ON public.profiles TO authenticated;

-- Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'email';

