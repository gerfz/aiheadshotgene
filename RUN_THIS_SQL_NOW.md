# 🚨 RUN THIS SQL NOW - Fix Auto Profile Creation

## The Real Problem
There's a trigger on `auth.users` that automatically creates profiles with **hardcoded 3 credits**, ignoring device_id checks!

## The Solution
Update the trigger to check for existing device_ids **before** creating the profile.

---

## 🚀 Step 1: Run This SQL

Go to **Supabase Dashboard** → **SQL Editor** → Copy and paste:

```sql
-- ============================================
-- FIX AUTO PROFILE CREATION WITH DEVICE TRACKING
-- ============================================

-- Drop old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new function that checks device_id
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
      
      RAISE NOTICE 'Device % already exists, copying % credits', 
        v_device_id, v_free_credits;
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

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Remove old device_id setter (not needed anymore)
DROP TRIGGER IF EXISTS trigger_set_device_id_only ON public.profiles;
DROP FUNCTION IF EXISTS set_device_id_only();

-- Verify
SELECT '✅ Fixed!' as status;
```

---

## 🧪 Step 2: Test It

### Clean Test:
1. **Delete all users** in Supabase (Authentication → Users)
2. **Clear app data** on your phone
3. **Open app** → Should get 3 credits ✅
4. **Use 1 credit** → Should have 2 credits ✅
5. **Clear app data again**
6. **Open app** → Should have 2 credits (not 3!) ✅

### Check Logs:
You should now see:
```
📱 Device ID: 668b9153d17069f2
✅ Credits refreshed: {"freeCredits": 2, ...}  ← NOT 3!
```

---

## 🔍 What Changed

### Before:
```
User creates anonymous account
↓
auth.users trigger fires
↓
Creates profile with HARDCODED 3 credits ❌
↓
Backend never gets to check device_id ❌
```

### After:
```
User creates anonymous account
↓
auth.users trigger fires
↓
Trigger checks: "Does this device_id exist?"
  ├─ YES → Copy credits from oldest account ✅
  └─ NO → Give 3 credits ✅
↓
Creates profile with correct credits ✅
```

---

## ✅ Expected Results

### First User (New Device):
```sql
id: user-1
device_id: abc123
free_credits: 3  ← New device
```

### After Clearing Cache (Same Device):
```sql
id: user-1
device_id: abc123
free_credits: 2  ← Used 1 credit

id: user-2
device_id: abc123
free_credits: 2  ← Copied from user-1! ✅
```

---

## 🐛 Troubleshooting

### Still getting 3 credits?

**Check 1:** Did the SQL run successfully?
```sql
-- Run this to verify the trigger exists:
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

**Check 2:** Delete ALL test users and try again
- The fix only works for NEW users created after running the SQL
- Old users still have 3 credits

**Check 3:** Check the Supabase logs
- Go to Supabase Dashboard → Logs
- Look for NOTICE messages like "Device abc123 already exists, copying 2 credits"

---

## 📊 Verify in Database

After testing, check your profiles table:

```sql
SELECT 
  SUBSTRING(id::TEXT, 1, 8) as user,
  device_id,
  free_credits,
  created_at
FROM profiles
WHERE device_id = '668b9153d17069f2'
ORDER BY created_at;
```

Should show:
```
user      | device_id          | free_credits | created_at
----------|--------------------|--------------|-----------
6a745196  | 668b9153d17069f2  | 2            | 10:00
25df4f72  | 668b9153d17069f2  | 2            | 10:05  ← Same!
```

---

**Run the SQL now and test!** 🚀

