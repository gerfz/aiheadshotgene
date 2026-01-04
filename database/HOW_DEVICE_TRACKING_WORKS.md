# 🔒 Device Tracking - How It Works

## The Problem
Users could clear app data and get 3 free credits again, exploiting the system.

## The Solution
Track devices and sync credits across all accounts from the same device.

---

## 🏗️ Architecture

### 1. Database Trigger (Simple)
**File:** `database/FINAL_DEVICE_TRACKING_FIX.sql`

**What it does:**
- ONLY sets `device_id` from auth metadata when a profile is created
- NO credit logic in the trigger
- NO update trigger (prevents conflicts)

```sql
CREATE TRIGGER trigger_set_device_id_only
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_device_id_only();
```

### 2. Backend Logic (Smart)
**File:** `backend/src/routes/user.ts` (lines 69-126)
**File:** `backend/src/services/supabase.ts` (lines 78-108)

**What it does:**

#### When `/credits` is called (profile creation):
```typescript
// 1. Get device_id from auth metadata
const deviceId = authUser?.user?.user_metadata?.device_id;

// 2. Check if device already has an account
const existingProfile = await supabase
  .from('profiles')
  .select('free_credits, is_subscribed')
  .eq('device_id', deviceId)
  .order('created_at', { ascending: true })
  .limit(1);

// 3. Copy credits from oldest account
if (existingProfile) {
  freeCredits = existingProfile.free_credits; // ✅ Preserves remaining credits!
  isSubscribed = existingProfile.is_subscribed;
}
```

#### When credits are used (decrementCredits):
```typescript
// 1. Decrement credits for current user
await supabase
  .from('profiles')
  .update({ free_credits: newCredits })
  .eq('id', userId);

// 2. Sync to ALL profiles with same device_id
if (profile?.device_id) {
  await supabase
    .from('profiles')
    .update({ free_credits: newCredits })
    .eq('device_id', profile.device_id)
    .neq('id', userId);
}
```

### 3. Mobile App (Simple)
**File:** `mobile/app/_layout.tsx`

**What it does:**
- Gets hardware device ID
- Creates anonymous user with device_id in metadata
- Backend handles the rest!

```typescript
const deviceId = await getHardwareDeviceId();

await supabase.auth.signInAnonymously({
  options: {
    data: {
      device_id: deviceId,
      is_anonymous: true,
    }
  }
});
```

---

## 🔄 User Flow

### Scenario 1: First Time User
```
User installs app
↓
App gets device_id: abc123
↓
Creates anonymous user with device_id in metadata
↓
Trigger sets device_id in profile
↓
Backend checks: No existing profile with device_id abc123
↓
Backend gives 3 free credits ✅
```

### Scenario 2: User Clears Cache (After Using 1 Credit)
```
User clears app data
↓
App gets device_id: abc123 (same device)
↓
Creates NEW anonymous user (different UUID)
↓
Trigger sets device_id in profile
↓
Backend checks: Found existing profile with device_id abc123
↓
Backend copies remaining credits: 2 credits ✅ (not 3!)
↓
User has 2 credits (exploit prevented!) 🎉
```

### Scenario 3: User Uses Credit on New Account
```
User uses 1 credit (now has 1 credit left)
↓
Backend decrements credits for current user
↓
Backend syncs to ALL profiles with device_id abc123
↓
Old account also updated to 1 credit ✅
```

---

## 📊 Database State

### Before Clear Cache:
| id (UUID) | device_id | free_credits | created_at |
|-----------|-----------|--------------|------------|
| user-1    | abc123    | 2            | 2025-01-01 |

### After Clear Cache:
| id (UUID) | device_id | free_credits | created_at |
|-----------|-----------|--------------|------------|
| user-1    | abc123    | 2            | 2025-01-01 |
| user-2    | abc123    | 2            | 2025-01-04 | ✅ Same credits!

### After Using 1 Credit on user-2:
| id (UUID) | device_id | free_credits | created_at |
|-----------|-----------|--------------|------------|
| user-1    | abc123    | 1            | 2025-01-01 | ✅ Synced!
| user-2    | abc123    | 1            | 2025-01-04 |

---

## 🚀 Setup Instructions

### 1. Run the SQL Migration
Go to Supabase Dashboard → SQL Editor → Run:
```bash
database/FINAL_DEVICE_TRACKING_FIX.sql
```

### 2. Deploy Backend
The backend already has the logic! Just make sure it's deployed:
```bash
cd backend
npm install
npm run build
# Deploy to your hosting (Render, Railway, etc.)
```

### 3. Test the App
```bash
cd mobile
npx expo start --clear
```

#### Test Steps:
1. Delete all users in Supabase (Authentication → Users)
2. Clear app data on phone
3. Open app → Should get 3 credits ✅
4. Use 1 credit → Should have 2 credits ✅
5. Clear app data again
6. Open app → Should have 2 credits (not 3!) ✅
7. Check database → Both profiles should have same device_id and credits ✅

---

## ✅ Why This Works

1. **Simple Trigger** = No database errors
2. **Backend Logic** = Smart credit handling
3. **Device Tracking** = One device = consistent credits
4. **Credit Syncing** = All accounts stay in sync

## 🔐 Security

- Device ID is hardware-based (can't be easily changed)
- Credits are synced across all accounts
- Backend validates all credit operations
- No client-side credit manipulation possible

---

## 🐛 Troubleshooting

### Issue: Still getting 3 credits after clearing cache
**Solution:** Make sure backend is deployed with latest code

### Issue: Database error when creating user
**Solution:** Run the SQL migration to remove complex triggers

### Issue: Credits not syncing
**Solution:** Check backend logs to ensure `decrementCredits` is being called

---

## 📝 Files Changed

- ✅ `database/FINAL_DEVICE_TRACKING_FIX.sql` - Simple trigger
- ✅ `backend/src/routes/user.ts` - Credit merging logic
- ✅ `backend/src/services/supabase.ts` - Credit syncing logic
- ✅ `mobile/app/_layout.tsx` - Device ID tracking

---

**Status:** ✅ Ready to deploy!

