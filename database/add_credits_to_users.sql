-- SQL Commands to Add Credits to Specific Users
-- Run these in Supabase SQL Editor

-- ============================================
-- METHOD 1: Add credits by User ID (UUID)
-- ============================================
-- This is the most reliable method

UPDATE public.profiles
SET free_credits = free_credits + 10  -- Add 10 credits
WHERE id = 'USER_UUID_HERE';

-- Example:
-- UPDATE public.profiles
-- SET free_credits = free_credits + 10
-- WHERE id = '07599b4d-675b-426b-b073-3a9b64e9241d';


-- ============================================
-- METHOD 2: Add credits by Email
-- ============================================
-- For users with email addresses (non-anonymous)

UPDATE public.profiles
SET free_credits = free_credits + 10  -- Add 10 credits
WHERE email = 'user@example.com';

-- Example:
-- UPDATE public.profiles
-- SET free_credits = free_credits + 10
-- WHERE email = 'john@example.com';


-- ============================================
-- METHOD 3: Add credits to multiple users at once
-- ============================================
-- Using a list of user IDs

UPDATE public.profiles
SET free_credits = free_credits + 10  -- Add 10 credits
WHERE id IN (
  'user-id-1',
  'user-id-2',
  'user-id-3'
);


-- ============================================
-- METHOD 4: Set exact credit amount (not add)
-- ============================================
-- If you want to set credits to a specific number instead of adding

UPDATE public.profiles
SET free_credits = 50  -- Set to exactly 50 credits
WHERE id = 'USER_UUID_HERE';


-- ============================================
-- METHOD 5: Add credits to all non-subscribed users
-- ============================================
-- Give credits to everyone who isn't subscribed

UPDATE public.profiles
SET free_credits = free_credits + 5  -- Add 5 credits
WHERE is_subscribed = FALSE;


-- ============================================
-- METHOD 6: Add credits to users who signed up recently
-- ============================================
-- Give credits to users who joined in the last 7 days

UPDATE public.profiles
SET free_credits = free_credits + 10  -- Add 10 credits
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND is_subscribed = FALSE;


-- ============================================
-- METHOD 7: Find user ID by device ID (for anonymous users)
-- ============================================
-- First, find the user ID from their device ID

SELECT 
  u.id,
  u.email,
  p.free_credits,
  p.is_subscribed,
  u.raw_user_meta_data->>'device_id' as device_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.raw_user_meta_data->>'device_id' = 'DEVICE_ID_HERE';

-- Then use the ID to add credits:
-- UPDATE public.profiles
-- SET free_credits = free_credits + 10
-- WHERE id = 'found-user-id';


-- ============================================
-- METHOD 8: Add credits and verify the change
-- ============================================
-- This shows before and after

-- Check current credits first:
SELECT id, email, free_credits, is_subscribed
FROM public.profiles
WHERE id = 'USER_UUID_HERE';

-- Add credits:
UPDATE public.profiles
SET free_credits = free_credits + 10
WHERE id = 'USER_UUID_HERE'
RETURNING id, email, free_credits;  -- Shows the updated values


-- ============================================
-- USEFUL QUERIES TO FIND USERS
-- ============================================

-- Find all users with their credits:
SELECT 
  p.id,
  p.email,
  p.free_credits,
  p.is_subscribed,
  p.created_at,
  u.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 20;

-- Find users with low credits:
SELECT 
  id,
  email,
  free_credits,
  is_subscribed
FROM public.profiles
WHERE free_credits < 3 AND is_subscribed = FALSE
ORDER BY free_credits ASC;

-- Find anonymous users:
SELECT 
  u.id,
  u.email,
  p.free_credits,
  u.raw_user_meta_data->>'device_id' as device_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.is_anonymous = TRUE OR u.email LIKE '%@anonymous.local'
ORDER BY u.created_at DESC;


-- ============================================
-- BULK OPERATIONS
-- ============================================

-- Give everyone 10 bonus credits:
UPDATE public.profiles
SET free_credits = free_credits + 10;

-- Reset all free users to 3 credits:
UPDATE public.profiles
SET free_credits = 3
WHERE is_subscribed = FALSE;

-- Give credits to users who have generated at least 1 portrait:
UPDATE public.profiles p
SET free_credits = free_credits + 5
WHERE EXISTS (
  SELECT 1 FROM generations g 
  WHERE g.user_id = p.id
)
AND p.is_subscribed = FALSE;

