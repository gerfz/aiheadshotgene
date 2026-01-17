-- =====================================================
-- UPDATE DEFAULT FREE CREDITS FROM 3 TO 5
-- Run this in Supabase SQL Editor
-- =====================================================

-- Update the default value for free_credits column in profiles table
ALTER TABLE profiles 
ALTER COLUMN free_credits SET DEFAULT 5;

-- Optional: Also update the trigger if it exists
-- Check if there's a trigger that creates profiles on user signup
-- You may need to update the trigger function as well

-- To verify the change:
-- SELECT column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name = 'free_credits';

