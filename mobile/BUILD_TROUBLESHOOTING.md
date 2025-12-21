# Build Troubleshooting Guide

This document lists all the issues we encountered while setting up the EAS build for Play Store and the solutions that fixed them.

---

## Summary

**Final working configuration:**
- Expo SDK: 54.0.30
- React: 19.1.0
- React Native: 0.81.5
- React Native Reanimated: ~4.1.1
- React Native Worklets: ~0.7.1
- Kotlin Version: 2.0.21 (via expo-build-properties)

---

## Issue 1: Peer Dependency Conflicts

**Error:**
```
npm error ERESOLVE could not resolve
npm error peer react-native-safe-area-context@">= 5.4.0" from expo-router@6.0.21
```

**Cause:** Package versions were incompatible with each other.

**Solution:**
1. Created `.npmrc` file with `legacy-peer-deps=true`
2. Updated `react-native-safe-area-context` to `~5.6.0`

---

## Issue 2: Kotlin Version Mismatch

**Error:**
```
Can't find KSP version for Kotlin version '1.9.24'. 
Supported versions are: '2.2.20, 2.2.10, 2.2.0, 2.1.21, 2.1.20, 2.1.10, 2.1.0, 2.0.21, 2.0.20, 2.0.10, 2.0.0'
```

**Cause:** Expo SDK 54 requires Kotlin 2.0.x but was defaulting to 1.9.24.

**Solution:**
1. Installed `expo-build-properties` package
2. Added it as the **first** plugin in `app.json`:
```json
"plugins": [
  [
    "expo-build-properties",
    {
      "android": {
        "kotlinVersion": "2.0.21",
        "compileSdkVersion": 35,
        "targetSdkVersion": 34,
        "minSdkVersion": 24
      }
    }
  ],
  // ... other plugins
]
```

---

## Issue 3: React Native Reanimated Compilation Error

**Error:**
```
react-native-reanimated:compileReleaseJavaWithJavac FAILED
Cannot find symbol: TRACE_TAG_REACT_JAVA_BRIDGE
```

**Cause:** We were using React Native 0.76.6 which was incompatible with the version of Reanimated.

**Solution:**
Updated to the official Expo SDK 54 recommended versions:
- `react`: 19.1.0
- `react-native`: 0.81.5
- `react-native-reanimated`: ~4.1.1

---

## Issue 4: Missing react-native-worklets

**Error:**
```
Cannot find module 'react-native-worklets/plugin'
```

**Cause:** React Native Reanimated 4.x requires `react-native-worklets` as a peer dependency.

**Solution:**
Added to `package.json`:
```json
"react-native-worklets": "~0.7.1"
```

**Note:** The package is `react-native-worklets`, NOT `react-native-worklets-core` (they are different packages).

---

## Issue 5: Package Lock Out of Sync

**Error:**
```
npm ci can only install packages when your package.json and package-lock.json are in sync.
Missing: react-native-worklets@0.7.1 from lock file
```

**Cause:** Changed `package.json` without running `npm install` to update the lock file.

**Solution:**
```bash
npm install --legacy-peer-deps
```

---

## Final Working package.json Dependencies

```json
{
  "dependencies": {
    "@react-navigation/native": "^7.0.12",
    "@supabase/supabase-js": "^2.89.0",
    "@types/react": "~19.1.10",
    "expo": "~54.0.30",
    "expo-build-properties": "~1.0.10",
    "expo-constants": "~18.0.0",
    "expo-file-system": "~19.0.21",
    "expo-font": "~14.0.10",
    "expo-image-picker": "~17.0.10",
    "expo-linking": "~8.0.11",
    "expo-media-library": "~18.2.1",
    "expo-router": "~6.0.21",
    "expo-secure-store": "~15.0.8",
    "expo-sharing": "~14.0.8",
    "expo-splash-screen": "~31.0.13",
    "expo-status-bar": "~3.0.9",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~4.1.1",
    "react-native-worklets": "~0.7.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-url-polyfill": "^2.0.0",
    "react-native-web": "^0.21.0",
    "typescript": "~5.9.2",
    "zustand": "^5.0.9"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@types/react": "~19.1.10",
    "typescript": "~5.9.2"
  }
}
```

---

## Final Working app.json Plugins

```json
"plugins": [
  [
    "expo-build-properties",
    {
      "android": {
        "kotlinVersion": "2.0.21",
        "compileSdkVersion": 35,
        "targetSdkVersion": 34,
        "minSdkVersion": 24
      }
    }
  ],
  "expo-router",
  [
    "expo-media-library",
    {
      "photosPermission": "Allow AI Portrait Studio to access your photos to save generated portraits.",
      "savePhotosPermission": "Allow AI Portrait Studio to save photos to your gallery.",
      "isAccessMediaLocationEnabled": true
    }
  ],
  [
    "expo-image-picker",
    {
      "photosPermission": "Allow AI Portrait Studio to access your photos to upload for portrait generation.",
      "cameraPermission": "Allow AI Portrait Studio to take photos for portrait generation."
    }
  ]
]
```

---

## Key Files Created/Modified

| File | Purpose |
|------|---------|
| `.npmrc` | Contains `legacy-peer-deps=true` for npm |
| `app.json` | Added expo-build-properties plugin with Kotlin 2.0.21 |
| `package.json` | Updated to Expo SDK 54 compatible versions |
| `eas.json` | Build configuration for EAS |
| `babel.config.js` | Contains `react-native-reanimated/plugin` |

---

## Build Commands

### Build APK for Testing
```bash
eas build --platform android --profile preview
```

### Build APK with Cache Clear (if having issues)
```bash
eas build --platform android --profile preview --clear-cache
```

### Build AAB for Play Store
```bash
eas build --platform android --profile production
```

---

## Lessons Learned

1. **Always use Expo's recommended versions** - Run `npx expo install --fix` to see what versions Expo expects.

2. **expo-build-properties must be first plugin** - It sets Kotlin version before other plugins run.

3. **react-native-worklets ≠ react-native-worklets-core** - They are different packages. Reanimated 4.x needs `react-native-worklets`.

4. **Always run npm install after changing package.json** - EAS uses `npm ci` which requires an up-to-date lock file.

5. **Use --clear-cache when changing build config** - Ensures EAS uses your new configuration.

---

## Quick Reference

If you need to rebuild from scratch:

```bash
cd mobile

# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Build
eas build --platform android --profile preview --clear-cache
```

---

*Last updated: December 21, 2025*

