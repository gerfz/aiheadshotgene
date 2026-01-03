# Upload Assets to Supabase Storage

This guide explains how to upload your local image assets to Supabase Storage to reduce app size and improve performance.

## Prerequisites

1. **Supabase Account**: Make sure you have a Supabase project set up
2. **Supabase Credentials**: You'll need:
   - Supabase URL (found in Project Settings > API)
   - Supabase Service Role Key (found in Project Settings > API > Service Role Key - **keep this secret!**)
3. **Dependencies**: Install required packages:
   ```bash
   npm install @supabase/supabase-js
   ```

## Steps

### 1. Set Up Environment Variables

Create a `.env` file in your project root (or export them in your terminal):

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
```

Or on Windows PowerShell:

```powershell
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_KEY="your-service-role-key"
```

### 2. Run the Upload Script

```bash
node upload-assets-to-supabase.js
```

### 3. What the Script Does

The script will:
1. ✅ Check if the `style-previews` bucket exists (creates it if not)
2. ✅ Upload all images from the following folders:
   - `1990s camera style`
   - `business`
   - `Childhood`
   - `creative`
   - `emotionalfilm`
   - `jobs`
   - `pokemons`
   - `professionalheadshot`
   - `slyfoxdumbbunny`
   - `victoriasecret`
   - `withpuppy`
3. ✅ Generate public URLs for all uploaded images
4. ✅ Save the URL mappings to `asset-urls.json`
5. ✅ Output code snippets for `styles.ts`

### 4. Update styles.ts

After the upload completes, you'll see output like:

```typescript
const BUSINESS_PHOTO_1 = { uri: 'https://your-project.supabase.co/storage/v1/object/public/style-previews/business/...' };
const TIGHT_PORTRAIT_PHOTO_1 = { uri: 'https://...' };
// ... etc
```

Copy these into your `mobile/src/constants/styles.ts` file, replacing the `require()` statements.

### 5. Verify in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Storage** > **style-previews**
3. Verify all images are uploaded
4. Check that the bucket is set to **Public**

### 6. Test in Your App

1. Run your app: `npm run android` or `npm run ios`
2. Navigate to the style selection screen
3. Verify all images load correctly
4. Check the app size has reduced significantly!

## Expected Results

### Before:
- App size: ~50-80 MB
- Images: Bundled in app
- Performance: Laggy with many images

### After:
- App size: ~10-15 MB (70-80% reduction!)
- Images: Loaded from CDN with caching
- Performance: Smooth scrolling with optimized rendering

## Troubleshooting

### "Error creating bucket"
- Check that your Service Role Key is correct
- Verify bucket doesn't already exist with different permissions

### "Error uploading"
- Check file permissions in the `assets` folder
- Verify image files aren't corrupted
- Check Supabase storage quota (1GB free tier)

### Images not loading in app
- Verify bucket is set to **Public** in Supabase Dashboard
- Check that URLs in `styles.ts` are correct
- Clear app cache and rebuild

## Security Note

⚠️ **Never commit your Service Role Key to version control!**

Add to `.gitignore`:
```
.env
asset-urls.json
```

## Performance Optimizations Applied

The following optimizations have been implemented:

1. ✅ **FastImage** for better image caching
2. ✅ **Memoized Components** to prevent unnecessary re-renders
3. ✅ **ScrollView Optimizations**:
   - `removeClippedSubviews={true}`
   - `maxToRenderPerBatch={10}`
   - `initialNumToRender={8}`
   - `windowSize={5}`
4. ✅ **Callback Hooks** for stable function references
5. ✅ **CDN Delivery** via Supabase Storage

## Need Help?

If you encounter issues:
1. Check the Supabase Dashboard logs
2. Verify your credentials
3. Ensure you have storage quota available
4. Contact support if bucket creation fails

