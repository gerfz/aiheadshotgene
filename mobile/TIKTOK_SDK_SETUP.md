# TikTok Business SDK Integration Guide

## Overview
This project has been integrated with TikTok Business SDK for Android to enable TikTok advertising and analytics tracking.

## What's Been Set Up

### 1. SDK Files
- ✅ TikTok SDK `.aar` file placed in `android/app/libs/`
- ✅ ProGuard rules added to `android/app/proguard-rules.pro`

### 2. Build Configuration
- ✅ Expo config plugin created (`plugins/withTikTokSDK.js`)
- ✅ Plugin registered in `app.json`
- ✅ Dependencies added:
  - `androidx.lifecycle:lifecycle-process:2.6.2`
  - `androidx.lifecycle:lifecycle-common-java8:2.6.2`
  - `com.android.installreferrer:installreferrer:2.2`

### 3. Native Module Bridge
- ✅ `TikTokSDKModule.java` - Native Android module
- ✅ `TikTokSDKPackage.java` - React Native package registration
- ✅ TypeScript wrapper (`libs/tiktok-sdk.ts`)

## How to Use

### Step 1: Get Your TikTok Credentials
1. Go to [TikTok for Business](https://business.tiktok.com/)
2. Create an app or use existing one
3. Get your:
   - App ID
   - TikTok App ID
   - Access Token (optional)

### Step 2: Initialize the SDK

In your app's entry point (e.g., `app/_layout.tsx` or `app/index.tsx`):

```typescript
import { useEffect } from 'react';
import tiktokSDK from './libs/tiktok-sdk';

export default function App() {
  useEffect(() => {
    // Initialize TikTok SDK
    tiktokSDK.initialize({
      appId: 'YOUR_APP_ID',
      tiktokAppId: 'YOUR_TIKTOK_APP_ID',
      accessToken: 'YOUR_ACCESS_TOKEN', // Optional
    }).catch(error => {
      console.error('TikTok SDK initialization failed:', error);
    });
  }, []);

  // ... rest of your app
}
```

### Step 3: Track Events

#### Track App Launch
```typescript
import tiktokSDK from './libs/tiktok-sdk';

// Track when user launches the app
await tiktokSDK.trackLaunch();
```

#### Track User Registration
```typescript
// Track when user completes registration
await tiktokSDK.trackRegistration('email'); // or 'google', 'facebook', etc.
```

#### Track Purchases
```typescript
// Track when user makes a purchase
await tiktokSDK.trackPurchase(
  9.99,           // value
  'USD',          // currency
  'subscription', // content type
  'premium_plan'  // content ID
);
```

#### Track Content Views
```typescript
// Track when user views generated portraits
await tiktokSDK.trackContentView('portrait', 'portrait_123');
```

#### Track Custom Events
```typescript
// Track any custom event
await tiktokSDK.trackEvent({
  eventName: 'portrait_generated',
  properties: {
    style: 'professional',
    count: 4,
    processing_time: 30
  }
});
```

## Available Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `initialize(config)` | Initialize the SDK | `{ appId, tiktokAppId, accessToken? }` |
| `trackEvent(event)` | Track custom event | `{ eventName, properties? }` |
| `trackInstall()` | Track app install | None |
| `trackLaunch()` | Track app launch | None |
| `trackPurchase(...)` | Track purchase | `value, currency, contentType?, contentId?` |
| `trackRegistration(method?)` | Track registration | `method?` (e.g., 'email') |
| `trackContentView(...)` | Track content view | `contentType, contentId` |
| `trackAddToCart(...)` | Track add to cart | `contentType, contentId, value?` |
| `trackCheckout(...)` | Track checkout | `value, currency` |

## Building the App

### For Development (with Expo Go)
```bash
npm run android
```

### For Production Build (with EAS)
```bash
# Make sure to prebuild first to generate native code
npx expo prebuild --clean

# Then build with EAS
eas build --platform android --profile production
```

### Local Development Build
```bash
# Prebuild to generate native Android code
npx expo prebuild --clean

# Run on Android
npx expo run:android
```

## Important Notes

1. **Rebuild Required**: After adding the TikTok SDK, you MUST rebuild the native Android app. Expo Go won't work with custom native modules.

2. **Use Development Build**: For testing, create a development build:
   ```bash
   eas build --platform android --profile development
   ```

3. **ProGuard**: ProGuard rules are already configured to keep TikTok SDK classes in release builds.

4. **Android Only**: This integration is Android-only. iOS would require a separate implementation.

5. **Privacy**: Make sure to update your privacy policy to mention TikTok tracking and get user consent where required.

## Troubleshooting

### "TikTok SDK native module not found"
- Make sure you've rebuilt the app after adding the SDK
- Run `npx expo prebuild --clean` to regenerate native code
- Check that the plugin is registered in `app.json`

### Build Errors
- Ensure the `.aar` file is in `android/app/libs/`
- Check that all dependencies are added in the config plugin
- Try cleaning the build: `cd android && ./gradlew clean`

### Events Not Showing in TikTok Dashboard
- Verify your App ID and TikTok App ID are correct
- Check that the SDK is initialized before tracking events
- Events may take a few hours to appear in the TikTok dashboard

## Example Integration

See `libs/tiktok-sdk.ts` for the full TypeScript wrapper implementation.

For a complete example of usage in your app, you can add tracking to key user actions:

```typescript
// In your subscription screen
import tiktokSDK from '../libs/tiktok-sdk';

const handleSubscribe = async (plan: string, price: number) => {
  // Your subscription logic...
  
  // Track the purchase
  await tiktokSDK.trackPurchase(price, 'USD', 'subscription', plan);
};

// In your portrait generation screen
const handleGeneratePortrait = async (style: string) => {
  // Your generation logic...
  
  // Track the content view
  await tiktokSDK.trackContentView('portrait_generation', style);
};
```

## Support

For TikTok SDK documentation, visit:
- [TikTok Business SDK Docs](https://business-api.tiktok.com/portal/docs?id=1739584855420929)
- [TikTok Events API](https://business-api.tiktok.com/portal/docs?id=1701890973258754)
