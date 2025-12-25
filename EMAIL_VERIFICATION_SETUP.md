# Email Verification Setup for Free Credits

## Overview
Users must now verify their email before receiving 3 free credits. This prevents abuse from users creating multiple accounts with fake emails.

---

## 🔧 Setup Instructions

### 1. Run Database Migration

Go to your **Supabase SQL Editor** and run the following file:
```
database/add_email_verification.sql
```

This migration will:
- Add `email_verified` column to track verification status
- Add `credits_awarded` column to track if initial credits were given
- Update the signup trigger to give 0 credits initially
- Create a function to award 3 credits after email verification
- Create a trigger that automatically awards credits when email is verified
- Mark all existing users as verified (so they don't lose access)

---

## 📋 How It Works

### New User Flow:
1. User signs up → Profile created with **0 credits**
2. User receives verification email from Supabase
3. User clicks verification link in email
4. Email is verified → **3 free credits automatically awarded**
5. User can now generate portraits

### Existing Users:
- All existing users are automatically marked as verified
- They keep their current credits
- No action needed from existing users

---

## 🎨 UI Changes

### Profile Page:
- Shows **"Email Verified"** badge (green) for verified users
- Shows **"Email Not Verified"** badge (orange) for unverified users
- Badge appears below the email address

### Credits Display:
- Backend now returns `emailVerified` status in credits API
- Frontend displays verification status on profile page

---

## 🔐 Security Benefits

1. **Prevents Abuse**: Users can't create unlimited accounts with fake emails
2. **Validates Users**: Ensures users have access to the email they provided
3. **Automatic**: Credits are awarded automatically upon verification
4. **Backward Compatible**: Existing users are not affected

---

## 📝 Files Changed

### Database:
- `database/add_email_verification.sql` - New migration file

### Backend:
- `backend/src/services/supabase.ts` - Added `checkAndAwardVerificationCredits()` function
- `backend/src/routes/user.ts` - Returns `emailVerified` status in credits endpoint

### Frontend:
- `mobile/src/types/index.ts` - Added `emailVerified` to `CreditsInfo` interface
- `mobile/app/profile.tsx` - Shows verification badge on profile page

---

## 🧪 Testing

### Test New User Flow:
1. Sign up with a real email
2. Check profile → Should show "Email Not Verified" and 0 credits
3. Check email inbox for verification link
4. Click verification link
5. Return to app → Should show "Email Verified" and 3 credits

### Test Existing Users:
1. Login with existing account
2. Check profile → Should show "Email Verified"
3. Credits should remain unchanged

---

## ⚠️ Important Notes

- **Supabase Email Settings**: Make sure email confirmation is enabled in Supabase Dashboard → Authentication → Email Auth
- **Email Templates**: You can customize the verification email in Supabase Dashboard → Authentication → Email Templates
- **Redirect URL**: Make sure your app's deep link (`aiportrait://`) is configured in Supabase redirect URLs

---

## 🔄 Rollback (If Needed)

If you need to revert this change:

```sql
-- Give all users 3 credits regardless of verification
UPDATE profiles SET free_credits = 3 WHERE free_credits = 0;

-- Remove the columns
ALTER TABLE profiles DROP COLUMN IF EXISTS email_verified;
ALTER TABLE profiles DROP COLUMN IF EXISTS credits_awarded;

-- Restore original trigger
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
DROP FUNCTION IF EXISTS sync_email_verification();
DROP FUNCTION IF EXISTS award_verification_credits(UUID);
```

