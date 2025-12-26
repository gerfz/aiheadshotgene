# 🛡️ Free Trial Abuse Prevention System

## Overview
This document explains how we prevent users from abusing free trials by creating multiple accounts.

## Strategy: Hardware Device ID Tracking

### Why Device ID > Google Account?
- ✅ **Google Account**: Easy to create unlimited accounts (2 minutes each)
- ✅ **Device ID (Android ID)**: Tied to physical hardware, survives factory reset on Android 8+
- ✅ **Much harder to bypass**: Requires a new physical device

## Implementation

### 1. Frontend: Device ID Collection
**File**: `mobile/src/services/deviceId.ts`

```typescript
import * as Application from 'expo-application';

export async function getHardwareDeviceId(): Promise<string> {
  // Android ID - unique per device, persists across app reinstalls
  const deviceId = Application.getAndroidId();
  return deviceId;
}
```

### 2. Backend: Device ID Tracking
**Database Table**: `device_trials`

```sql
CREATE TABLE device_trials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT UNIQUE NOT NULL,
  trial_used_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_device_trials_device_id ON device_trials(device_id);
```

### 3. Trial Check Flow

```
User Opens App
    ↓
Get Hardware Device ID
    ↓
Check Backend: Has this device used trial?
    ↓
YES → Show "Trial already used" → Require subscription
NO  → Grant 3 free credits → Mark device as used
```

### 4. Backend Endpoint

**Route**: `POST /api/user/check-trial`

```typescript
router.post('/check-trial', async (req, res) => {
  const { deviceId } = req.body;
  
  // Check if device has used trial
  const { data } = await supabase
    .from('device_trials')
    .select('*')
    .eq('device_id', deviceId)
    .single();
  
  if (data) {
    return res.json({ trialAvailable: false });
  }
  
  // Mark device as used
  await supabase
    .from('device_trials')
    .insert({ device_id: deviceId });
  
  return res.json({ trialAvailable: true });
});
```

## Additional Security Measures

### 1. Server-Side Validation
- Never trust client-side checks
- Always validate on backend
- Log all trial attempts

### 2. Rate Limiting
- Limit trial checks per IP address
- Prevent brute force attempts

### 3. RevenueCat Integration
- Track purchases across devices
- Sync subscription status
- Detect refund abuse

## Migration Plan

### Phase 1: Add Device Tracking (Non-Breaking)
1. Add `device_trials` table
2. Start collecting device IDs
3. Log but don't enforce

### Phase 2: Enforce (After Testing)
1. Enable enforcement
2. Monitor for false positives
3. Add support bypass for edge cases

## Edge Cases

### Case 1: Factory Reset
- **Android 8+**: Device ID persists ✅
- **Android 7-**: Device ID changes ❌
- **Solution**: Also track by Google Play account

### Case 2: Used Device Purchase
- User buys a used phone that had trial used
- **Solution**: Allow manual trial reset via support

### Case 3: Emulators
- Emulators can fake device IDs
- **Solution**: Detect emulators, require real device for trial

## SQL Migration

Run this in Supabase SQL Editor:

```sql
-- Create device trials table
CREATE TABLE IF NOT EXISTS device_trials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT UNIQUE NOT NULL,
  trial_used_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_trials_device_id ON device_trials(device_id);
CREATE INDEX IF NOT EXISTS idx_device_trials_user_id ON device_trials(user_id);

-- Grant permissions
ALTER TABLE device_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access" ON device_trials
  FOR ALL USING (true);
```

## Testing

### Test Scenario 1: New Device
1. Install app on new device
2. Should get 3 free credits
3. Device ID saved to database

### Test Scenario 2: Reinstall
1. Uninstall app
2. Reinstall app
3. Same device ID → No new trial

### Test Scenario 3: Multiple Accounts
1. Create account A → Use trial
2. Logout, create account B
3. Same device → No new trial

## Monitoring

Track these metrics:
- Trial usage per day
- Duplicate device attempts
- Conversion rate (trial → paid)
- Refund rate

## Support Bypass

For legitimate cases (used phone, etc.):
```sql
-- Reset trial for specific device
DELETE FROM device_trials WHERE device_id = 'DEVICE_ID_HERE';
```

## Conclusion

This system provides **strong protection** against trial abuse while maintaining a good user experience. The hardware device ID is the best balance between security and usability.

