# AI Portrait Generator

Transform your photos into professional headshots using AI. Built with React Native (Expo) and powered by the Nano Banana model via Replicate API.

## Features

- 📸 Upload any photo from camera or gallery
- 🎨 Choose from professional style presets
- ⚡ AI-powered portrait generation
- 💾 Download and share results
- 🔐 Secure authentication with Supabase
- 💳 Freemium model with subscription support

## Tech Stack

| Component | Technology |
|-----------|------------|
| Mobile App | React Native + Expo |
| Navigation | React Navigation |
| State Management | Zustand |
| Backend | Node.js + Express |
| AI Model | Nano Banana via Replicate API |
| Auth & Database | Supabase |
| Storage | Supabase Storage |

## Project Structure

```
ai-portrait-generator/
├── mobile/                 # React Native Expo app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # App screens
│   │   ├── services/       # API and auth services
│   │   ├── store/          # Zustand state management
│   │   ├── constants/      # Style presets and config
│   │   └── types/          # TypeScript types
│   └── assets/             # Images and fonts
│
├── backend/                # Express API server
│   └── src/
│       ├── routes/         # API endpoints
│       ├── services/       # AI and database services
│       └── middleware/     # Auth middleware
│
└── database/               # SQL schema files
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- Replicate API token (get from [replicate.com](https://replicate.com))

### 1. Clone and Install

```bash
# Install mobile dependencies
cd mobile
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `database/schema.sql` in the SQL Editor
3. Create a storage bucket named `portraits` with public access
4. Get your project URL and keys from Settings > API

### 3. Configure Environment Variables

**Backend (`backend/.env`):**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REPLICATE_API_TOKEN=your_replicate_api_token
PORT=3000
```

**Mobile (`mobile/src/constants/config.ts`):**
```typescript
export const SUPABASE_URL = 'your_supabase_url';
export const SUPABASE_ANON_KEY = 'your_supabase_anon_key';
```

### 4. Run the App

**Start Backend:**
```bash
cd backend
npm run dev
```

**Start Mobile (Android):**
```bash
cd mobile
npx expo start --android
```

## Style Presets

The app includes 3 professional styles:

1. **Corporate Executive** - Navy suit with studio backdrop
2. **Creative Professional** - Smart casual with modern setting
3. **Friendly Business** - Approachable oxford shirt look

Each style uses carefully crafted prompts to maintain facial consistency while transforming the image into a professional portrait.

## Subscription Model

- **Free Tier**: 3 portrait generations
- **Pro Subscription**: Unlimited generations ($4.99/month or $39.99/year)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | Generate a new portrait |
| `/api/generate/:id/status` | GET | Check generation status |
| `/api/generate/styles` | GET | List available styles |
| `/api/user/credits` | GET | Get remaining credits |
| `/api/user/generations` | GET | List past generations |
| `/api/user/subscription` | POST | Update subscription status |

## Adding New Styles

Add new styles in `mobile/src/constants/styles.ts` and `backend/src/services/nanoBanana.ts`:

```typescript
newStyle: {
  key: 'newStyle',
  name: 'New Style Name',
  description: 'Style description',
  thumbnail: PLACEHOLDER_IMAGE,
  prompt: `Your detailed prompt here...`
}
```

## License

MIT License

