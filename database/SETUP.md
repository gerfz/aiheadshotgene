# Database Setup Instructions

## Step 1: Run the Database Schema

1. Go to **Supabase Dashboard** > **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the entire contents of `schema.sql`
4. Click **"Run"**

This will create:
- `profiles` table
- `generations` table
- Triggers for automatic profile creation
- Row Level Security policies

---

## Step 2: Create the Storage Bucket

1. Go to **Supabase Dashboard** > **Storage**
2. Click **"Create a new bucket"**
3. Name: `portraits`
4. ✅ Make it **Public**
5. Click **"Create bucket"**

---

## Step 3: Add Storage Policies

Go back to **SQL Editor** and run:

```sql
-- Storage policy for uploads
CREATE POLICY "Users can upload own portraits"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portraits' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy for viewing
CREATE POLICY "Anyone can view portraits"
ON storage.objects FOR SELECT
USING (bucket_id = 'portraits');
```

---

## Step 4: Create Test User (Manual Method)

1. Go to **Supabase Dashboard** > **Authentication** > **Users**
2. Click **"Add user"** dropdown
3. Select **"Create new user"**
4. Fill in:
   - **Email**: `admin@admin.ee`
   - **Password**: `admin`
   - **Auto Confirm User**: ✅ **MUST CHECK THIS**
5. Click **"Create user"**

The trigger will automatically create their profile!

---

## Step 5: Give Test User Extra Credits (Optional)

Run in SQL Editor:

```sql
UPDATE profiles 
SET free_credits = 100,
    is_subscribed = true
WHERE email = 'admin@admin.ee';
```

---

## Troubleshooting

### "Database error creating new user"

This usually means:

1. **Schema not set up**: Run `schema.sql` first (Step 1)
2. **Trigger not working**: Check if the trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. **RLS blocking**: The trigger uses `SECURITY DEFINER` so it should bypass RLS

### Check if setup is complete

Run this query to verify:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'generations');

-- Check if trigger exists
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check if profiles exist
SELECT COUNT(*) as profile_count FROM profiles;
```

### Still having issues?

Create the user directly via SQL (as service role):

```sql
-- This should be done via Supabase Dashboard > Authentication
-- But if the trigger isn't working, you can insert manually:

-- First, get the user's ID from auth.users
SELECT id, email FROM auth.users WHERE email = 'admin@admin.ee';

-- Then manually create the profile (replace USER_ID_HERE)
INSERT INTO profiles (id, email, free_credits, is_subscribed)
VALUES (
  'USER_ID_HERE'::uuid,  -- Replace with actual user ID
  'admin@admin.ee',
  100,
  true
);
```

