-- Manual verification for testing
-- Replace 'USER_EMAIL_HERE' with the actual email you're testing with

-- Step 1: Check current status
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.email_verified,
  p.credits_awarded,
  p.free_credits
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'USER_EMAIL_HERE';

-- Step 2: Manually verify the user (if needed for testing)
-- UNCOMMENT AND RUN THIS IF YOU NEED TO MANUALLY VERIFY:
/*
UPDATE public.profiles
SET 
  email_verified = TRUE,
  free_credits = 3,
  credits_awarded = TRUE,
  updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE');
*/

-- Step 3: Verify it worked
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.email_verified,
  p.credits_awarded,
  p.free_credits
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'USER_EMAIL_HERE';

