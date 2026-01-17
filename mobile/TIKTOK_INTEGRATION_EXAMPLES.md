# TikTok SDK Integration Examples

## Quick Start

### 1. Add Initialization to App Entry Point

In `app/_layout.tsx`, add the TikTok SDK initialization:

```typescript
import tiktokService from '../src/services/tiktok';

export default function RootLayout() {
  useEffect(() => {
    const initApp = async () => {
      // ... your existing initialization code ...
      
      // Initialize TikTok SDK
      await tiktokService.initialize();
      
      // ... rest of your code ...
    };
    
    initApp();
  }, []);
  
  // ... rest of your component
}
```

### 2. Update Your TikTok Credentials

Edit `src/services/tiktok.ts` and replace the placeholder credentials:

```typescript
const TIKTOK_CONFIG = {
  appId: 'YOUR_ACTUAL_APP_ID',
  tiktokAppId: 'YOUR_ACTUAL_TIKTOK_APP_ID',
  accessToken: '', // Optional
};
```

## Integration Points

### Track User Registration

In your authentication/signup flow (likely in `app/login.tsx` or similar):

```typescript
import tiktokService from '../src/services/tiktok';

const handleSignUp = async (email: string, password: string) => {
  // Your signup logic...
  const { user, error } = await supabase.auth.signUp({ email, password });
  
  if (user && !error) {
    // Track registration
    await tiktokService.trackRegistration('email');
  }
};
```

### Track Subscription Purchases

In your subscription/purchase handler (likely in `src/services/purchases.ts` or `app/subscription.tsx`):

```typescript
import tiktokService from './tiktok';

// After successful subscription purchase
const handleSubscriptionPurchase = async (productId: string, price: number) => {
  // Your purchase logic...
  
  // Track the purchase
  await tiktokService.trackSubscriptionPurchase(productId, price, 'USD');
};
```

### Track Portrait Generation

In your portrait generation screen (likely `app/generating.tsx` or similar):

```typescript
import tiktokService from '../src/services/tiktok';

const handleGenerationComplete = async (style: string, count: number) => {
  // Your generation completion logic...
  
  // Track the generation
  await tiktokService.trackPortraitGeneration(style, count);
};
```

### Track Style Selection

In your style selection screen (`app/style-select.tsx` or `app/style-select-new.tsx`):

```typescript
import tiktokService from '../src/services/tiktok';

const handleStyleSelect = async (style: string) => {
  // Your style selection logic...
  
  // Track the selection
  await tiktokService.trackStyleSelection(style);
  
  // Navigate to next screen...
};
```

### Track Portrait Views

In your result/gallery screen (`app/result.tsx` or `app/gallery.tsx`):

```typescript
import tiktokService from '../src/services/tiktok';

useEffect(() => {
  // When portrait is viewed
  if (portraitId && style) {
    tiktokService.trackPortraitView(portraitId, style);
  }
}, [portraitId, style]);
```

### Track Portrait Downloads

When user downloads a portrait:

```typescript
import tiktokService from '../src/services/tiktok';

const handleDownload = async (portraitId: string) => {
  // Your download logic...
  await saveToGallery(imageUri);
  
  // Track the download
  await tiktokService.trackPortraitDownload(portraitId);
};
```

### Track Portrait Sharing

When user shares a portrait:

```typescript
import tiktokService from '../src/services/tiktok';
import * as Sharing from 'expo-sharing';

const handleShare = async (portraitId: string, imageUri: string) => {
  // Your sharing logic...
  await Sharing.shareAsync(imageUri);
  
  // Track the share
  await tiktokService.trackPortraitShare(portraitId, 'native_share');
};
```

### Track Subscription Screen View

In your subscription screen (`app/subscription.tsx`):

```typescript
import tiktokService from '../src/services/tiktok';

export default function SubscriptionScreen() {
  useEffect(() => {
    // Track when user views subscription options
    tiktokService.trackSubscriptionView();
  }, []);
  
  // ... rest of your component
}
```

## Complete Example: Portrait Generation Flow

Here's a complete example of tracking a user's journey through portrait generation:

```typescript
// app/style-select.tsx
import tiktokService from '../src/services/tiktok';

export default function StyleSelectScreen() {
  const handleStyleSelect = async (style: string) => {
    // Track style selection
    await tiktokService.trackStyleSelection(style);
    
    // Navigate to upload
    router.push('/upload');
  };
  
  // ... rest of component
}

// app/generating.tsx
import tiktokService from '../src/services/tiktok';

export default function GeneratingScreen() {
  const handleGenerationComplete = async (portraits: any[], style: string) => {
    // Track successful generation
    await tiktokService.trackPortraitGeneration(style, portraits.length);
    
    // Navigate to results
    router.push('/result');
  };
  
  // ... rest of component
}

// app/result.tsx
import tiktokService from '../src/services/tiktok';

export default function ResultScreen() {
  useEffect(() => {
    // Track portrait view
    if (portraitId) {
      tiktokService.trackPortraitView(portraitId, style);
    }
  }, [portraitId]);
  
  const handleDownload = async () => {
    await saveToGallery(imageUri);
    await tiktokService.trackPortraitDownload(portraitId);
  };
  
  const handleShare = async () => {
    await Sharing.shareAsync(imageUri);
    await tiktokService.trackPortraitShare(portraitId, 'native_share');
  };
  
  // ... rest of component
}
```

## Testing

### Before Building

1. Update credentials in `src/services/tiktok.ts`
2. Add initialization call in `app/_layout.tsx`
3. Add tracking calls to relevant screens

### Build the App

Since this uses native modules, you need to rebuild:

```bash
# Clean prebuild
npx expo prebuild --clean

# Build with EAS (recommended)
eas build --platform android --profile development

# Or build locally
npx expo run:android
```

### Verify Tracking

1. Check console logs for "TikTok SDK: ..." messages
2. Perform actions in the app (signup, generate portrait, etc.)
3. Check TikTok Events Manager dashboard (events may take a few hours to appear)

## Important Notes

1. **Rebuild Required**: You must rebuild the native app after adding the SDK
2. **Android Only**: This integration only works on Android
3. **Privacy**: Update your privacy policy and get user consent where required
4. **Testing**: Use development builds for testing before production release

## Next Steps

1. ✅ Update TikTok credentials in `src/services/tiktok.ts`
2. ✅ Add initialization to `app/_layout.tsx`
3. ✅ Add tracking calls to your screens
4. ✅ Rebuild the app with `npx expo prebuild --clean`
5. ✅ Test with development build
6. ✅ Deploy to production with EAS Build

## Support

If you encounter issues:
- Check that the `.aar` file is in `android/app/libs/`
- Verify the plugin is in `app.json`
- Ensure you've rebuilt after adding the SDK
- Check console logs for error messages
- Review the main setup guide: `TIKTOK_SDK_SETUP.md`
