# Email Column Not Updating - Troubleshooting Guide

## 🔍 Problem
Email column shows "-" in Supabase database even after saving from the app.

## 🛠️ Solution Steps

### **Step 1: Run SQL Migration**

Go to **Supabase Dashboard → SQL Editor** and run this:

```sql
-- Fix email update permissions
database/fix_email_update_permissions.sql
```

Or copy and paste this directly:

```sql
-- Ensure email column exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Drop conflicting policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile for verification" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile email" ON public.profiles;

-- Create comprehensive UPDATE policy
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
```

### **Step 2: Verify Column Exists**

Run this query to check:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'email';
```

Should return:
```
column_name | data_type
email       | text
```

### **Step 3: Check RLS Policies**

Go to **Supabase Dashboard → Authentication → Policies → profiles table**

You should see:
- ✅ "Users can update their own profile" (UPDATE)
- ✅ "Users can view own profile" (SELECT)

### **Step 4: Test Manual Update**

In SQL Editor, replace `YOUR_USER_ID` with your actual user ID:

```sql
UPDATE public.profiles
SET email = 'test@example.com'
WHERE id = 'YOUR_USER_ID';

-- Verify
SELECT id, email FROM public.profiles WHERE id = 'YOUR_USER_ID';
```

If this works, the problem is with RLS policies.
If this doesn't work, the column might not exist.

### **Step 5: Check App Logs**

After running the SQL fixes, try updating email in the app again.

Check the logs (in your terminal/console) for:
```
Updating email for user: [user-id]
New email: [email]
Update successful: [data]
```

Or if there's an error:
```
Supabase error: [error details]
```

## 🔧 Common Issues & Fixes

### **Issue 1: "new row violates row-level security policy"**
**Fix:** The UPDATE policy is missing or incorrect.
```sql
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### **Issue 2: "column 'email' does not exist"**
**Fix:** Add the email column.
```sql
ALTER TABLE public.profiles ADD COLUMN email TEXT;
```

### **Issue 3: "permission denied for table profiles"**
**Fix:** Grant permissions to authenticated role.
```sql
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
```

### **Issue 4: Email shows "-" in Supabase UI**
**Possible causes:**
1. Column doesn't exist → Run Step 1
2. Update failed silently → Check app logs
3. RLS policy blocking → Check Step 3
4. Looking at wrong user → Verify user ID

## 🧪 Quick Test

1. Open your app
2. Go to Profile/Settings
3. Tap "Email"
4. Enter: `test@example.com`
5. Tap "Save"
6. Check terminal logs for errors
7. Go to Supabase → Table Editor → profiles
8. Find your user row
9. Check if email column shows the email

## 📊 Verification Checklist

- [ ] Email column exists in profiles table
- [ ] RLS is enabled on profiles table
- [ ] UPDATE policy exists for authenticated users
- [ ] SELECT policy exists for authenticated users
- [ ] Manual SQL update works
- [ ] App shows "Success" message
- [ ] Supabase table shows the email
- [ ] Contact Us page auto-fills the email

## 🆘 Still Not Working?

If email still shows "-" after all steps:

1. **Check your user ID:**
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-login-email@example.com';
   ```

2. **Check if profile exists:**
   ```sql
   SELECT * FROM public.profiles WHERE id = 'YOUR_USER_ID';
   ```

3. **Try direct update with service role:**
   - Go to Supabase Dashboard
   - Table Editor → profiles
   - Click on your user row
   - Edit email column directly
   - If this works, it's an RLS issue

4. **Check for triggers:**
   ```sql
   SELECT trigger_name, event_manipulation, action_statement
   FROM information_schema.triggers
   WHERE event_object_table = 'profiles';
   ```

5. **Disable RLS temporarily (for testing only):**
   ```sql
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
   -- Try updating from app
   -- Then re-enable:
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ```

## 💡 Pro Tips

- Always check the app console logs first
- Use `.select()` after `.update()` to see what was actually updated
- Test with SQL Editor before debugging app code
- RLS policies are the most common issue
- Make sure you're looking at the correct user in Supabase

## 📝 Expected Result

After fixing, you should see:

**Supabase Dashboard → profiles table:**
```
UID                                  | Email
5e1bee8f-aafc-45df-b298-cebbca9f6400 | user@example.com
```

**App Profile Screen:**
```
Email: user@example.com ✏️
```

**Contact Us Screen:**
```
Email: [user@example.com] (pre-filled)
```

Run the SQL fix and try again! 🚀

