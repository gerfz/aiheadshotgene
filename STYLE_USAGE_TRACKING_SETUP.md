# Style Usage Tracking Setup

## Overview
Implemented dynamic "Most Used" styles tracking based on actual user generation data.

## What Was Implemented

### 1. Database (Supabase)
**File:** `database/add_style_usage_tracking.sql`

- Created `style_usage` table to track usage counts for each style
- Created `increment_style_usage()` function to safely increment counts
- Created `most_used_styles` view to fetch top 4 styles (excluding custom)
- Set up RLS policies for public read access
- Pre-populated with all available styles at 0 count

**Run this SQL in Supabase SQL Editor:**
```bash
# Execute the entire contents of database/add_style_usage_tracking.sql
```

### 2. Backend API
**Files Modified:**
- `backend/src/services/supabase.ts` - Added `incrementStyleUsage()` and `getMostUsedStyles()` functions
- `backend/src/routes/generate.ts` - Added style tracking on successful generation and new endpoint

**New Endpoint:**
- `GET /api/generate/most-used-styles` - Returns top 4 most used styles (public, no auth required)

**Tracking Logic:**
- Every successful portrait generation increments the style's usage count
- Happens automatically after credits are deducted

### 3. Mobile App
**Files Modified:**
- `mobile/src/services/api.ts` - Added `getMostUsedStyles()` API call
- `mobile/app/style-select.tsx` - Dynamically loads and displays most used styles

**How It Works:**
1. On screen load, fetches most used styles from backend
2. **Custom style is ALWAYS #1** in "Most Used" category
3. Next 4 slots are filled with actual top used styles
4. Falls back to defaults (business, emotional_film, victoria_secret, professional_headshot) if not enough data
5. Shows loading indicator while fetching data

**Categories:**
- ⚡ **Most Used** - Custom (always first) + Top 4 dynamically loaded
- 💼 **Business** - Business, Professional Headshot, 1990s Camera (static)
- 💕 **Dating** - Emotional Film, With Puppy, 1990s Camera (static)

## Deployment Steps

### 1. Run Database Migration
```sql
-- In Supabase SQL Editor, run:
-- database/add_style_usage_tracking.sql
```

### 2. Deploy Backend
```bash
# Backend will auto-deploy on Render when you push to GitHub
git add .
git commit -m "Add style usage tracking"
git push origin main
```

### 3. Test the Feature
1. Generate a few portraits with different styles
2. Go to style selection screen
3. The "Most Used" category should show custom + your most used styles

## How to Monitor Usage
```sql
-- View all style usage counts
SELECT * FROM public.style_usage ORDER BY usage_count DESC;

-- View most used styles (same as API returns)
SELECT * FROM public.most_used_styles;

-- Manually increment a style for testing
SELECT increment_style_usage('business');
```

## Benefits
- ✅ Custom style always appears first (as requested)
- ✅ Data-driven recommendations based on actual usage
- ✅ Automatic tracking on every generation
- ✅ Graceful fallback to defaults if no data
- ✅ Public endpoint (no auth needed) for fast loading
- ✅ Scales automatically as more users generate portraits

