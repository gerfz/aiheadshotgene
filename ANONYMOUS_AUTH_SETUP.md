# Anonymous Authentication Setup

## 🎯 What Changed

We've implemented **anonymous Supabase authentication** so that:
- ✅ Users never see a login screen
- ✅ Each device gets a unique Supabase user ID automatically
- ✅ Subscriptions work via RevenueCat + Supabase
- ✅ Users get 3 free credits on first launch
- ✅ Subscription status is tracked per user ID (not device ID)

## 🔧 Setup Steps

### 1. Enable Anonymous Auth in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **"Anonymous"** in the list
4. **Enable** the toggle
5. Click **Save**

### 2. Run Database Migration

Run this SQL in **Supabase SQL Editor**:

```sql
-- Copy and paste the entire contents of:
database/enable_anonymous_auth.sql
```

This updates the trigger to:
- Give anonymous users 3 free credits immediately
- Mark them as "verified" (no email verification needed)
- Support both anonymous and regular users

### 3. Deploy Backend Changes

```bash
git add .
git commit -m "Implement anonymous authentication"
git push origin main
```

Backend will auto-deploy on Render.

### 4. Test the Flow

1. **Uninstall** the app completely (to clear all data)
2. **Reinstall** the app
3. App should:
   - Auto-create an anonymous Supabase user
   - Show 3 free credits
   - Allow generating portraits
   - Allow subscribing via Google Play

## 🔄 How It Works

### On First Launch:
```
1. App gets device ID (Android ID)
   ↓
2. Checks for existing Supabase session
   ↓
3. No session found → Creates anonymous user
   ↓
4. Supabase assigns a real user ID (UUID)
   ↓
5. Database trigger creates profile with 3 credits
   ↓
6. RevenueCat links to this user ID
   ↓
7. User can now generate & subscribe
```

### On Subscription:
```
1. User clicks "Subscribe" in app
   ↓
2. Google Play processes payment
   ↓
3. RevenueCat detects subscription
   ↓
4. App calls backend: POST /api/user/subscription
   ↓
5. Backend updates profiles.is_subscribed = true
   ↓
6. User gets unlimited generations
```

### On App Restart:
```
1. App checks for existing Supabase session
   ↓
2. Session exists → Uses same user ID
   ↓
3. No new user created
   ↓
4. Subscription status persists
```

## 📊 Database Structure

### Anonymous User Profile:
```sql
profiles {
  id: "550e8400-e29b-41d4-a716-446655440000" -- Real Supabase UUID
  email: "device-abc123@anonymous.local"       -- Generated email
  free_credits: 3                              -- Initial credits
  is_subscribed: false                         -- Can be upgraded
  email_verified: true                         -- Auto-verified
  credits_awarded: true                        -- Credits given
}
```

### After Subscription:
```sql
profiles {
  id: "550e8400-e29b-41d4-a716-446655440000" -- Same user ID
  email: "device-abc123@anonymous.local"       -- Same email
  free_credits: 3                              -- Unchanged
  is_subscribed: true                          -- ✅ Subscribed!
  email_verified: true
  credits_awarded: true
}
```

## 🔍 Debugging

### Check if Anonymous User Was Created:
```sql
-- In Supabase SQL Editor
SELECT 
  u.id,
  u.email,
  u.is_anonymous,
  u.created_at,
  p.free_credits,
  p.is_subscribed
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE '%@anonymous.local'
ORDER BY u.created_at DESC
LIMIT 10;
```

### Check Subscription Status:
```sql
SELECT 
  id,
  email,
  free_credits,
  is_subscribed,
  created_at
FROM public.profiles
WHERE is_subscribed = true;
```

### App Logs to Watch For:
```
✅ Good logs:
- "📱 Device ID: abc123..."
- "✅ Anonymous user created: 550e8400-..."
- "✅ Credits refreshed: { freeCredits: 3, isSubscribed: false }"

❌ Bad logs:
- "❌ Failed to create anonymous user"
- "❌ App initialization error"
```

## ⚠️ Important Notes

1. **Device ID is NOT the user ID anymore**
   - Device ID: Used for trial abuse prevention
   - User ID: Real Supabase UUID for subscriptions

2. **Users are "anonymous" but fully functional**
   - They can generate portraits
   - They can subscribe
   - They can restore purchases
   - They just don't have email/password

3. **Subscription survives app reinstall**
   - RevenueCat tracks by Google Play account
   - User can "Restore Purchases" to relink

4. **Backend API still works the same**
   - All endpoints expect `Authorization: Bearer <token>`
   - Token is from anonymous Supabase session
   - No code changes needed in backend routes

## 🚀 Benefits

- ✅ Zero friction onboarding
- ✅ Subscriptions work perfectly
- ✅ No email verification hassle
- ✅ Backend code unchanged
- ✅ RevenueCat integration intact
- ✅ Can still track abuse by device ID
- ✅ Users can restore purchases on new device

## 🔮 Future: Converting Anonymous to Real Users

If you want to add email/password later:

```typescript
// User can "upgrade" their anonymous account
const { data, error } = await supabase.auth.updateUser({
  email: 'user@example.com',
  password: 'newpassword123'
});

// Their user ID stays the same
// Subscription is preserved
// Generations are preserved
```

