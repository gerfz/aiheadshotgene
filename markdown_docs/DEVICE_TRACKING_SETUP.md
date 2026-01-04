# 🔒 Device Tracking Setup - Prevent Credit Exploitation

## Problem
Users can clear app data and get 3 free credits again, exploiting the system.

## Solution
Track device hardware ID (Android ID / iOS Vendor ID) in the database to prevent duplicate free credits.

---

## 🚀 Setup Instructions

### Step 1: Run SQL Migration in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `database/add_device_tracking.sql`
4. Copy and paste the entire SQL script
5. Click **Run** to execute

This will:
- ✅ Add `device_id` column to `profiles` table
- ✅ Create unique index to prevent duplicate device_ids
- ✅ Create functions to check if device was already used
- ✅ Migrate existing users' device_ids from auth metadata
- ✅ Create trigger to auto-populate device_id on new profiles

### Step 2: Deploy Backend Changes

The backend has been updated to:
- Check if `device_id` already exists before creating a profile
- Give **0 credits** if device was already used
- Give **3 credits** only for new devices

**Deploy the updated backend:**
```bash
cd backend
npm install
npm run build
# Deploy to your hosting (Render, etc.)
```

### Step 3: Test the Fix

#### Test Case 1: New Device (Should Get 3 Credits)
1. Install app on a fresh device
2. Complete onboarding
3. Check credits → Should show **3 free credits**

#### Test Case 2: Clear App Data (Should Get 0 Credits)
1. Go to Settings → Apps → AI Headshot Generator
2. Clear app data
3. Reopen app and complete onboarding
4. Check credits → Should show **0 free credits** ✅

#### Test Case 3: Reinstall App (Should Get 0 Credits)
1. Uninstall the app
2. Reinstall the app
3. Complete onboarding
4. Check credits → Should show **0 free credits** ✅

---

## 🔍 How It Works

### Device ID Tracking

**Android:**
- Uses `Application.getAndroidId()`
- Unique per device, survives factory reset (Android 8+)
- Stored in `expo-secure-store` for fast access

**iOS:**
- Uses `Application.getIosIdForVendorAsync()`
- Unique per device per vendor
- Resets only if all apps from vendor are uninstalled

### Flow Diagram

```
User Opens App
     ↓
Get Hardware Device ID (Android ID / iOS Vendor ID)
     ↓
Check Supabase Auth Session
     ↓
┌─────────────────────────────────────┐
│ No Session? Create Anonymous User  │
│ - Store device_id in user metadata  │
└─────────────────────────────────────┘
     ↓
Backend Creates Profile
     ↓
Check if device_id exists in profiles table
     ↓
┌─────────────────┬──────────────────┐
│ Device Exists?  │ New Device?      │
│ → 0 Credits ❌  │ → 3 Credits ✅   │
└─────────────────┴──────────────────┘
```

---

## 📊 Database Schema

### profiles Table (Updated)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | User ID (Primary Key) |
| `email` | TEXT | User email |
| `free_credits` | INTEGER | Remaining free credits |
| `is_subscribed` | BOOLEAN | Pro subscription status |
| `device_id` | TEXT | Hardware device ID (Unique) |
| `created_at` | TIMESTAMP | Account creation time |

### Indexes

- `idx_profiles_device_id` - Fast device_id lookups
- `idx_profiles_device_id_unique` - Prevents duplicate device_ids

---

## 🛡️ Security Features

### 1. Hardware-Based Tracking
- Uses actual hardware ID, not app-generated UUID
- Survives app reinstall, clear data, factory reset

### 2. Unique Constraint
- Database enforces one profile per device_id
- Prevents race conditions and duplicate entries

### 3. Backend Validation
- Backend checks device_id before awarding credits
- Mobile app cannot bypass this check

### 4. Metadata Sync
- device_id stored in both auth.users metadata and profiles table
- Automatic sync via database trigger

---

## 🧪 SQL Queries for Testing

### Check if device is already used:
```sql
SELECT * FROM profiles WHERE device_id = 'YOUR_DEVICE_ID';
```

### See all device IDs:
```sql
SELECT id, email, device_id, free_credits, created_at 
FROM profiles 
WHERE device_id IS NOT NULL
ORDER BY created_at DESC;
```

### Find duplicate device attempts:
```sql
SELECT device_id, COUNT(*) as count
FROM profiles
WHERE device_id IS NOT NULL
GROUP BY device_id
HAVING COUNT(*) > 1;
```

### Manually reset a device (for testing):
```sql
-- WARNING: Only for testing!
UPDATE profiles 
SET device_id = NULL 
WHERE id = 'USER_ID_HERE';
```

---

## 🔧 Troubleshooting

### Issue: User still getting 3 credits after clearing data

**Possible causes:**
1. SQL migration not run → Run `database/add_device_tracking.sql`
2. Backend not deployed → Deploy updated backend code
3. Old app version → User needs to update app

**Check:**
```sql
-- Verify device_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'device_id';

-- Check if device_id is being stored
SELECT id, device_id, free_credits 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;
```

### Issue: New users getting 0 credits

**Possible causes:**
1. Device ID collision (very rare)
2. User previously used the app and uninstalled

**Check:**
```sql
-- Find the user's device_id
SELECT id, email, device_id, free_credits, created_at
FROM profiles
WHERE id = 'USER_ID_HERE';

-- Check if device was used before
SELECT id, email, created_at
FROM profiles
WHERE device_id = 'DEVICE_ID_HERE'
ORDER BY created_at ASC;
```

---

## 📱 Mobile App Changes

### No changes needed!

The mobile app already sends `device_id` in the user metadata:

```typescript
// mobile/app/_layout.tsx (lines 61-68)
const { data, error } = await supabase.auth.signInAnonymously({
  options: {
    data: {
      device_id: deviceId,  // ✅ Already sending this
      is_anonymous: true,
    }
  }
});
```

---

## ✅ Verification Checklist

- [ ] SQL migration run in Supabase
- [ ] Backend deployed with updated code
- [ ] Test: New device gets 3 credits
- [ ] Test: Clear data gets 0 credits
- [ ] Test: Reinstall gets 0 credits
- [ ] Check: device_id column populated in database
- [ ] Check: No duplicate device_ids in database

---

## 🎯 Expected Behavior After Fix

| Action | Credits Given | Reason |
|--------|---------------|--------|
| First install on new device | 3 credits ✅ | New device_id |
| Clear app data | 0 credits ❌ | device_id already used |
| Uninstall + reinstall | 0 credits ❌ | device_id already used |
| Factory reset (Android 8+) | 0 credits ❌ | Android ID persists |
| Different device | 3 credits ✅ | New device_id |

---

## 📝 Notes

- **Existing users**: Will be migrated automatically with their current device_id
- **Anonymous users**: Tracked by device_id, not email
- **Signed-up users**: Also tracked by device_id to prevent exploitation
- **Pro users**: Unaffected, they have unlimited credits anyway

---

## 🚨 Important

After running the SQL migration, **existing users who haven't exploited the system will keep their credits**. Only new attempts to get free credits from the same device will be blocked.

Users who already exploited the system will keep their existing credits, but won't be able to get more by clearing data.

