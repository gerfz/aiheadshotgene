# Guest User Flow

This document describes the "try before signup" flow that allows users to use the app without creating an account first.

## Overview

When a user first installs the app:
1. They are assigned a unique guest ID (stored securely on device)
2. They receive 3 free portrait generations
3. They can use the app fully as a guest
4. When credits run out, they're prompted to sign up for 3 more free credits
5. On signup, their guest data (generated portraits) is migrated to their new account

## How It Works

```
App Install
    ↓
Generate Guest ID (stored in SecureStore)
    ↓
Home Screen (Guest Mode)
    ↓
User has 3 free credits
    ↓
[Generate Portrait] ←→ Credits decremented
    ↓
Credits exhausted?
    ↓
Yes → Show "Sign Up" Modal
    ↓
User signs up → Guest data migrated to account
    ↓
User gets 3 more free credits
```

## Files Changed

### Mobile App

| File | Description |
|------|-------------|
| `src/services/guestStorage.ts` | Guest ID management (create, get, clear) |
| `src/services/api.ts` | Unified API for both users and guests |
| `src/store/useAppStore.ts` | Added `guestId`, `isGuest` state |
| `app/_layout.tsx` | Initialize guest ID on app launch |
| `app/index.tsx` | Route guests to home (not login) |
| `app/home.tsx` | Guest-aware UI, signup modal |
| `app/login.tsx` | Data migration on signup, "continue as guest" |
| `app/profile.tsx` | Guest-aware profile page |
| `app/gallery.tsx` | Uses unified API |

### Backend

| File | Description |
|------|-------------|
| `src/middleware/auth.ts` | Added `verifyGuestOrToken`, `verifyGuestOnly` |
| `src/routes/user.ts` | Added `/guest/credits`, `/guest/generations`, `/migrate-guest` |
| `src/routes/generate.ts` | Supports both authenticated and guest users |
| `src/services/supabase.ts` | Guest profile and generation functions |

### Database

| File | Description |
|------|-------------|
| `database/schema.sql` | Updated with guest tables and functions |
| `database/migration_guest_support.sql` | Migration script for existing databases |

## API Endpoints

### Guest Endpoints

```
GET  /api/user/guest/credits      - Get guest credits
GET  /api/user/guest/generations  - Get guest's generation history
```

### Authenticated Endpoints (unchanged)

```
GET  /api/user/credits            - Get user credits
GET  /api/user/generations        - Get user's generation history
POST /api/user/migrate-guest      - Migrate guest data after signup
```

### Unified Endpoints (work for both)

```
POST /api/generate                - Generate portrait
GET  /api/generate/:id/status     - Get generation status
DELETE /api/generate/:id          - Delete generation
```

## Headers

### Authenticated Requests
```
Authorization: Bearer <jwt_token>
```

### Guest Requests
```
X-Guest-Device-Id: <guest_uuid>
```

## Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- See database/migration_guest_support.sql for full script
```

## Testing

1. Clear app data / reinstall app
2. Launch app - should go directly to home
3. Verify "Guest Mode" badge is shown
4. Generate a portrait (uses 1 credit)
5. Check profile - should show 2 credits remaining
6. Use all 3 credits
7. Try to generate - should show signup modal
8. Sign up - guest data should be migrated
9. Verify you now have 3 new credits + old portraits

## Security Considerations

1. Guest IDs are UUIDs generated on device - collision-resistant
2. Guest data is isolated by device ID
3. RLS policies ensure guests can only access their own data
4. Migration happens atomically on signup
5. Guest IDs are stored in SecureStore (encrypted on device)

