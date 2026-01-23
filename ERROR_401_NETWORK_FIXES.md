# Fixes for 401 and Network Request Errors

## Date: 2026-01-22 (Round 2)

## Problem Statement

Users are experiencing two main errors when trying to generate portraits:

1. **"Server Error (401): Missing or invalid authorization header"**
2. **"Network request failed"**

---

## Root Cause Analysis

### Error #1: 401 - Missing Authorization Header

**Why this happens:**

The app uses Supabase anonymous authentication on launch. The initialization process has multiple timeout-protected steps:

```
1. Get device ID (timeout: 3s)
2. Check Supabase session (timeout: 8s)  
3. Create anonymous user if needed (timeout: 8s)
4. Verify session (timeout: 5s)
5. Initialize purchases (timeout: 10s)
```

**If ANY of these timeout or fail:**
- The app continues anyway (to not block users)
- User might not have a valid session token
- When they try to generate, the API call fails with 401

**Common scenarios:**
- User has slow internet → session check times out
- Supabase is slow to respond → user creation times out
- User switches networks during init → session becomes invalid
- App resumed from background with expired session

---

### Error #2: Network Request Failed

**Why this happens:**

Generic network error from React Native's `fetch()`. Can be caused by:

1. **No internet connection** - User is offline
2. **Poor connection** - Request times out
3. **DNS failure** - Can't resolve backend domain
4. **Network switch** - User switches WiFi/cellular mid-request
5. **Firewall/VPN** - Network blocking the request
6. **Background restrictions** - OS limiting network access

**Previous implementation:**
```typescript
// Just threw generic error
throw new Error('Network request failed');
```

**Problem:** Users saw unhelpful "Network request failed" message without guidance.

---

## Fixes Applied

### Fix #1: Pre-flight Session Check

**What:** Check if user has valid session BEFORE navigating to generating screen.

**Where:** `mobile/app/style-select.tsx` and `mobile/app/style-select-new.tsx`

**Code:**
```typescript
const handleContinue = async () => {
  if (selectedStyle) {
    // Pre-flight check: ensure user has valid session
    try {
      const session = await getSession();
      if (!session) {
        Alert.alert(
          'Session Error',
          'Please restart the app to continue.',
          [{ text: 'OK' }]
        );
        return; // Block navigation
      }
    } catch (error) {
      // Network error while checking session
      Alert.alert(
        'Connection Error',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return; // Block navigation
    }
    
    // Only proceed if session is valid
    router.push('/generating');
  }
};
```

**Result:**
- ✅ Catches missing session BEFORE user wastes time
- ✅ Shows clear actionable message ("restart app")
- ✅ Prevents 401 errors during generation
- ✅ Catches network issues early

---

### Fix #2: Better Network Error Handling

**What:** Catch network errors and show user-friendly messages.

**Where:** `mobile/src/services/api.ts` - `generatePortrait()`

**Code:**
```typescript
export async function generatePortrait(...) {
  try {
    // ... existing code ...
    
    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: { ...headers },
      body: formData,
    });
    
    // ... handle response ...
    
  } catch (error: any) {
    // NEW: Specifically handle network errors
    if (error.message === 'Network request failed' || 
        error.message?.includes('fetch')) {
      console.error('❌ Network error during generation:', error);
      throw new Error(
        'Network connection failed. Please check your internet connection and try again.'
      );
    }
    // Re-throw other errors as-is
    throw error;
  }
}
```

**Result:**
- ✅ Users see helpful message about internet connection
- ✅ Clear guidance on what to do (check connection, try again)
- ✅ Better PostHog tracking with descriptive error

---

### Fix #3: Graceful Auth Token Retrieval

**What:** Handle failures when getting auth token.

**Where:** `mobile/src/services/api.ts` - `getAuthHeaders()`

**Before:**
```typescript
async function getAuthHeaders() {
  const token = await getAccessToken();
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}
```

**After:**
```typescript
async function getAuthHeaders() {
  try {
    const token = await getAccessToken();
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    console.warn('⚠️ No auth token available');
    return {};
  } catch (error: any) {
    console.error('❌ Failed to get auth token:', error.message);
    return {}; // Return empty to let backend handle auth error
  }
}
```

**Result:**
- ✅ Doesn't crash if token retrieval fails
- ✅ Logs the specific error for debugging
- ✅ Lets backend return proper 401 with clear error

---

## Expected Improvements

### For 401 Errors:

**Before:** 
- User uploads photo → selects style → generating screen → 401 error → confused

**After:**
- User uploads photo → selects style → ⚠️ "Session Error - restart app" → blocked
- OR user completes generation successfully with valid session

**Expected reduction:** 60-80% fewer 401 errors during generation

---

### For Network Errors:

**Before:**
- User sees: "Network request failed" (unclear what to do)

**After:**
- User sees: "Network connection failed. Please check your internet connection and try again."
- Clear action: Check WiFi/data, then retry

**Expected improvement:** Users understand the issue and can self-resolve

---

## Monitoring in PostHog

### Check if fixes are working:

1. **Filter:** `event = 'generation_failed'` AND `error` contains `"401"`
   - **Expect:** Significant decrease after app update
   
2. **Filter:** `event = 'generation_failed'` AND `error` contains `"Network"`
   - **Before:** Error message is `"Network request failed"`
   - **After:** Error message is `"Network connection failed. Please check your internet connection..."`
   
3. **New metric to track:**
   - Count of session checks that fail (will see in app logs)
   - Should correlate with prevented 401 errors

---

## Testing Checklist

### Test 401 Prevention:

- [ ] Start app with airplane mode ON
  - Expected: Shows connection error when trying to generate
  
- [ ] Start app normally, then enable airplane mode, then try to generate
  - Expected: Session check fails → shows connection error
  
- [ ] Force-quit app during initialization (mid-load)
  - Expected: On restart, should complete init or show error
  
- [ ] Restart app → immediately try to generate
  - Expected: Works fine if session valid, blocked if not

### Test Network Error Handling:

- [ ] Disable internet mid-generation
  - Expected: Shows "Network connection failed. Please check..."
  
- [ ] Enable then disable airplane mode quickly
  - Expected: Clear error message, not generic "Network request failed"
  
- [ ] Switch from WiFi to cellular mid-request
  - Expected: Either succeeds or shows network error (not 401)

---

## Remaining Edge Cases

### Still possible (but less likely):

1. **Session expires MID-generation:**
   - User starts with valid session
   - Session expires during the 30-60s generation time
   - Gets 401 when polling for status
   - **Fix:** The generating screen already handles 401 and redirects to login

2. **Network fails after job is queued:**
   - Request succeeds (job queued)
   - Network fails during status polling
   - User sees timeout error
   - **Workaround:** User can check gallery later - job will still complete

3. **Token refresh fails silently:**
   - Supabase token expires
   - Auto-refresh fails due to network
   - Next API call gets 401
   - **Fix:** Session check catches this before generation

---

## Summary

### Changes Made:

1. ✅ Added pre-flight session check before generating
2. ✅ Improved network error messages
3. ✅ Added error handling for auth token retrieval
4. ✅ Updated both style selection screens

### Expected Results:

- 📉 60-80% reduction in 401 errors during generation
- 📈 Better user understanding of network issues
- 🎯 Clearer errors in PostHog for remaining issues
- ✅ Users get helpful guidance instead of generic errors

### Files Modified:

- `mobile/src/services/api.ts` - Network error handling
- `mobile/app/style-select-new.tsx` - Session check
- `mobile/app/style-select.tsx` - Session check
- `DEBUGGING_GUIDE.md` - Added network error scenario
- `FIXES_APPLIED.md` - Documented all fixes
