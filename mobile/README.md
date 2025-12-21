# AI Portrait Studio - Mobile App

Professional AI-generated portraits powered by React Native and Expo.

## 🚀 Quick Start

### Development
```bash
npm install
npm start
```

### Production Build
```bash
npm install -g eas-cli
eas login
eas init
npm run build:android:production
```

## 📚 Documentation

- **[PRODUCTION_READY_SUMMARY.md](./PRODUCTION_READY_SUMMARY.md)** - Start here! Overview of production setup
- **[QUICK_START_PRODUCTION.md](./QUICK_START_PRODUCTION.md)** - Quick guide to build for Play Store
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[PRE_LAUNCH_CHECKLIST.md](./PRE_LAUNCH_CHECKLIST.md)** - Pre-launch checklist
- **[PRIVACY_POLICY.md](./PRIVACY_POLICY.md)** - Privacy policy template

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: Zustand
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **AI**: Replicate (nano-banana model)
- **Authentication**: Supabase Auth

## 📱 Features

- ✨ AI-powered portrait generation
- 🎨 Multiple professional styles
- 📸 Photo upload from camera or gallery
- 💾 Download and share portraits
- 🗂️ Portrait gallery
- 👤 User profiles
- 💳 Credits system
- 🔐 Secure authentication

## 🏗️ Project Structure

```
mobile/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Entry point
│   ├── login.tsx          # Login screen
│   ├── home.tsx           # Home/dashboard
│   ├── upload.tsx         # Photo upload
│   ├── style-select.tsx   # Style selection
│   ├── generating.tsx     # Generation progress
│   ├── result.tsx         # Result display
│   ├── gallery.tsx        # Portrait gallery
│   └── profile.tsx        # User profile
├── src/
│   ├── components/        # Reusable components
│   ├── constants/         # App constants
│   ├── hooks/            # Custom hooks
│   ├── services/         # API services
│   ├── store/            # State management
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── assets/               # Images and icons
├── app.json             # Expo configuration
├── eas.json             # EAS Build configuration
└── package.json         # Dependencies
```

## 🔧 Configuration

### Environment Variables

Create `src/constants/config.ts`:

```typescript
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
```

### Supabase Setup

Update `src/services/supabase.ts` with your Supabase credentials.

## 📦 Build Commands

```bash
# Development
npm start                              # Start Expo dev server
npm run android                        # Run on Android emulator
npm run ios                           # Run on iOS simulator

# Production
npm run build:android:preview         # Build APK for testing
npm run build:android:production      # Build AAB for Play Store
npm run submit:android               # Submit to Play Store
```

## 🧪 Testing

### Manual Testing
1. Test all user flows
2. Test on multiple devices
3. Test with different network conditions
4. Test edge cases (no credits, etc.)

### Test User
- Email: admin@admin.ee
- Password: admin

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy
1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Initialize: `eas init`
4. Build: `npm run build:android:production`
5. Upload to Play Console

## 📝 License

Private - All rights reserved

## 🤝 Support

For issues or questions, contact: [your-email@example.com]

---

**Ready to deploy?** Start with [PRODUCTION_READY_SUMMARY.md](./PRODUCTION_READY_SUMMARY.md)

