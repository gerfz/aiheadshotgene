# TikTok SDK Debug Mode Testing Guide

## ✅ Debug Mode is Now Enabled!

Debug mode has been configured in your app to help you test TikTok event tracking.

## Configuration

In `src/services/tiktok.ts`:

```typescript
const DEBUG_MODE = true;
const TEST_EVENT_CODE = 'TEST12345'; // Change this to your actual test code
```

## How to Test

### Step 1: Get Your Test Event Code

1. Go to [TikTok Events Manager](https://business.tiktok.com/)
2. Navigate to your app → Events
3. Click on "Test Events" or "Debug Mode"
4. Copy your test event code (e.g., `TEST12345`)

### Step 2: Update the Test Event Code

Edit `mobile/src/services/tiktok.ts` and replace `TEST12345` with your actual test event code:

```typescript
const TEST_EVENT_CODE = 'YOUR_ACTUAL_TEST_CODE_HERE';
```

### Step 3: Rebuild and Run

The app is currently building. Once it launches:

1. **Open the app** on your Android emulator
2. **Check console logs** for:
   - `TikTok SDK: Initialized successfully`
   - `TikTok SDK: Debug mode enabled with test event code`
   - `TikTok SDK: App launch tracked`

### Step 4: Trigger Events

Interact with your app to trigger events:

- ✅ **App Launch** - Automatic when app opens
- ✅ **Registration** - Create new user (automatic)
- ✅ **Subscription View** - Open subscription screen
- ✅ **Style Selection** - Select a style
- ✅ **Portrait Generation** - Generate a portrait
- ✅ **Portrait View** - View generated portrait
- ✅ **Download** - Download a portrait
- ✅ **Share** - Share a portrait

### Step 5: Verify in TikTok Dashboard

1. Go to TikTok Events Manager
2. Navigate to "Event Activity" or "Test Events"
3. You should see your test events appearing (may take a few minutes)
4. Events will be marked as "Test" and won't affect your production data

## What's Different in Debug Mode?

When `DEBUG_MODE = true`:
- All events include a `test_event_code` property
- Events appear in TikTok's test events section
- Events are excluded from production analytics
- Events are excluded from ad campaigns

## Console Logs to Watch For

### Successful Initialization
```
TikTok SDK: Initializing...
TikTok SDK: Initialized successfully
TikTok SDK: Debug mode enabled with test event code
TikTok SDK: App launch tracked
```

### Event Tracking
```
TikTok SDK: User identified
TikTok SDK: Registration tracked
TikTok SDK: Subscription view tracked
TikTok SDK: Style selection tracked
TikTok SDK: Portrait generation tracked
TikTok SDK: Portrait view tracked
TikTok SDK: Portrait download tracked
TikTok SDK: Portrait share tracked
```

## Switching to Production Mode

Once testing is complete:

1. Edit `src/services/tiktok.ts`
2. Change `DEBUG_MODE` to `false`:
   ```typescript
   const DEBUG_MODE = false;
   ```
3. Rebuild the app
4. All events will now be sent as production events

## Troubleshooting

### Events Not Showing in Dashboard
- Wait 5-10 minutes (events can be delayed)
- Verify your test event code is correct
- Check console logs for errors
- Make sure you're looking in the "Test Events" section

### "TikTok SDK native module not found"
- Make sure you rebuilt the app after adding native code
- Run: `npx expo run:android` (not `expo start`)

### Build Errors
- Ensure `.aar` file is in `android/app/libs/`
- Check JAVA_HOME and ANDROID_HOME are set
- Try cleaning: `cd android && ./gradlew clean`

## Current Status

✅ Debug mode enabled
✅ Test event code configured
✅ All tracking events instrumented
✅ App building...

Once the build completes, open the app and start testing! Watch the console logs and TikTok dashboard for your events.

## Next Steps

1. ⏳ Wait for build to complete
2. 🚀 Launch app on emulator
3. 🎯 Interact with app features
4. 👀 Watch console logs
5. ✅ Verify events in TikTok dashboard
6. 🔄 Switch to production mode when ready
