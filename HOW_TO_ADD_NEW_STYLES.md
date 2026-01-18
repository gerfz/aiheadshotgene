# How to Add New Styles to AI Headshot Generator

This guide explains the **fully automated workflow** for adding new portrait styles to the app.

---

## 🎯 Quick Start (For User)

To add a new style, simply provide:
1. **Category name** (e.g., `dating`, `creative`, `professional`)
2. **Style name** (e.g., "Wine Bar", "Coffee Date", "Business Casual")

**Example:**
```
Add new style to dating category called "Wine Bar"
```

That's it! The AI assistant will handle the rest.

---

## 🤖 Automated Workflow (What Happens Behind the Scenes)

### Step 1: AI Generates the Prompt
Based on the style name and category, the AI creates a detailed generation prompt following best practices:
- Starts with face preservation instructions
- Includes detailed clothing, environment, lighting descriptions
- Optimized for high-quality, realistic results

### Step 2: Generate Preview Image via Replicate API
The AI:
1. Calls Replicate API with the generated prompt
2. Uses a generic reference face (not the user's face)
3. **Alternates gender for preview images** (female → male → female → male)
   - This ensures both genders are represented in the app
   - Users see that the style works for everyone
   - Prevents gender bias in style previews
4. Generates a preview image using the Nano Banana model
5. Receives the image URL from Replicate

**Gender Alternation Strategy:**
- Check the last added style's preview gender
- Generate the opposite gender for the new style
- Maintains balanced representation across all styles
- Example sequence: Wine Bar (male) → Coffee Date (female) → Beach Sunset (male)

### Step 3: Upload Preview to Supabase Storage
The AI automatically:
1. Downloads the generated image from Replicate
2. Uploads it to Supabase Storage bucket: `style-previews`
3. Gets the public URL for use in the app
4. **No local assets stored** - everything uses Supabase URLs

### Step 4: Review & Approval
The AI presents:
- 🖼️ **Preview image URL** for review (Supabase hosted)
- 📝 **Generated prompt** for verification

**User responds:**
- ✅ "yes" / "approve" / "looks good" → Proceed to Step 5
- ❌ "no" / "regenerate" → AI adjusts prompt and regenerates
- 🔧 "change [aspect]" → AI modifies specific parts and regenerates

### Step 5: Automated Integration
Once approved, the AI automatically updates **ALL** necessary files:

#### A. Update Frontend Constants
**File:** `mobile/src/constants/styles.ts`

Adds image constant using Supabase URL:
```typescript
// Wine Bar photos
const WINE_BAR_PHOTO_1 = { uri: 'https://pyziuothzjdijkvdryht.supabase.co/storage/v1/object/public/style-previews/winebar/preview.jpg' };
```

Adds style definition:
```typescript
wine_bar: {
  key: 'wine_bar',
  name: 'Wine Bar',
  description: 'Sophisticated wine bar date night with romantic ambiance',
  thumbnail: WINE_BAR_PHOTO_1,
  thumbnails: [WINE_BAR_PHOTO_1],
  prompt: `Keep the facial features of the person in the uploaded image exactly consistent...`,
},
```

#### B. Update Backend Service
**File:** `backend/src/services/nanoBanana.ts`

Adds prompt to `STYLE_PROMPTS`:
```typescript
export const STYLE_PROMPTS: Record<string, string> = {
  wine_bar: `Keep the facial features of the person in the uploaded image exactly consistent...`,
  // ... other styles
};
```

#### C. Add to Category - PRIMARY FILE ⚠️
**File:** `mobile/app/style-select.tsx` ← **THIS IS THE ACTIVE FILE**

Updates the category's `styles` array:
```typescript
const STATIC_CATEGORIES = [
  // ... other categories
  {
    id: 'dating',
    name: 'Dating',
    icon: '💕',
    styles: ['wine_bar', 'emotional_film', 'with_puppy', 'nineties_camera'], // ✅ Added wine_bar
  },
  // ... other categories
];
```

#### D. Update Other Style Select Files (For Consistency)
**Files:** 
- `mobile/src/screens/StyleSelectScreen.tsx` (backup/unused)
- `mobile/app/style-select-new.tsx` (backup/unused)

These are updated for consistency but are **NOT** currently used in the app.

### Step 6: Cleanup
The AI automatically:
- Deletes temporary generation scripts
- Removes temporary output files
- Cleans up any local asset folders (since we use Supabase)

### Step 7: Confirmation
The AI confirms completion with:
- ✅ Preview uploaded to Supabase
- ✅ Files modified (all 3 style select files + constants + backend)
- ✅ Style key used
- ✅ Category updated
- 📱 Reminder to rebuild/reload the app

---

## 📋 Available Categories

Current categories in the app (from `mobile/app/style-select.tsx`):

| Category ID | Display Name | Icon | Description |
|------------|--------------|------|-------------|
| `most_used` | Most Used | ⚡ | Dynamically populated with top used styles |
| `business` | Business | 💼 | Professional corporate headshots |
| `dating` | Dating | 💕 | Romantic and date-friendly styles |
| `social_lifestyle` | Social / Lifestyle | 📸 | Casual social situations |
| `creative` | Creative | 🎭 | Artistic and character-based styles |
| `adventure` | Adventure | 🏔️ | Outdoor and exploration themes |
| `classy` | Classy | 👔 | Elegant and sophisticated styles |
| `winter` | Winter | ❄️ | Winter and holiday themes |
| `jobs` | Jobs | 💼 | Professional career styles |

---

## 🎨 Prompt Generation Best Practices (Automated)

The AI automatically includes:

### 1. Face Preservation (Always First)
```
Keep the facial features of the person in the uploaded image exactly consistent. 
Preserve 100% accuracy of the face from the reference image. 
Important: do not change the face.
```

### 2. Scene Description
- Clothing details (colors, materials, style)
- Environment/background
- Props or special elements
- Pose and expression

### 3. Technical Details
- Lighting setup (warm, cool, dramatic, soft)
- Camera specifications (lens, aperture, style)
- Photo quality requirements (8k, high-detail, etc.)
- Artistic style notes (cinematic, editorial, etc.)

### 4. Composition & Mood
- Framing (medium portrait, full body, etc.)
- Depth of field and bokeh
- Color palette
- Overall mood and atmosphere

### 5. Context-Aware Generation
The AI considers:
- Category theme (dating vs professional vs creative)
- Style name implications
- Current trends and popular styles
- Consistency with existing styles
- **Gender alternation** for preview images (female/male rotation)

### 6. Gender Representation
**Important:** Preview images alternate between genders to ensure:
- Both male and female users see themselves represented
- No gender bias in style selection
- Users understand all styles work for everyone
- Balanced visual representation across the app

The AI automatically:
- Checks the most recent style's preview gender
- Generates the opposite gender for the new preview
- Uses appropriate reference images from Unsplash
- Maintains a roughly 50/50 gender balance

---

## 🔄 Complete Example Workflow

**User Request:**
```
Add new style to dating category called "Wine Bar"
```

**AI Response:**
```
🎨 Generating style "Wine Bar" for dating category...

📝 Generated Prompt:
Keep the facial features of the person in the uploaded image exactly consistent. 
Preserve 100% accuracy of the face from the reference image. Important: do not 
change the face. Create a sophisticated, romantic wine bar portrait. The person 
wears elegant casual attire - a stylish burgundy or deep plum button-up shirt...

👤 Gender Selection: Male (alternating from previous female style)
📸 Reference Image: https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d

🖼️ Generating preview image via Replicate API...

Preview Image: https://replicate.delivery/xezq/xGcdthLCGAZEL5eOrXBJbP68uafRnM7fbprualiGjWkrHa9rA/tmp7xfda7pn.jpeg

📤 Uploading to Supabase Storage...

✅ Uploaded to: https://pyziuothzjdijkvdryht.supabase.co/storage/v1/object/public/style-previews/winebar/preview.jpg

Please review and respond:
- Type "yes" to approve and proceed
- Type "no" to regenerate with adjustments
```

**User:**
```
yes
```

**AI:**
```
✅ Approved! Integrating style into the app...

✅ Uploaded: Supabase Storage (style-previews/winebar/preview.jpg)
✅ Updated: mobile/src/constants/styles.ts (added constant + style definition)
✅ Updated: backend/src/services/nanoBanana.ts (added prompt)
✅ Updated: mobile/app/style-select.tsx (added to dating category) ← PRIMARY FILE
✅ Updated: mobile/src/screens/StyleSelectScreen.tsx (for consistency)
✅ Updated: mobile/app/style-select-new.tsx (for consistency)
✅ Cleaned up: Temporary scripts and local assets

Style Details:
- Style Key: wine_bar
- Category: dating (Dating 💕)
- Preview URL: https://pyziuothzjdijkvdryht.supabase.co/.../winebar/preview.jpg

📱 Next Step: Restart/reload your app to see the new style!
   - Press 'r' in terminal to reload
   - Or restart: npx expo run:android
```

---

## 🛠️ Technical Details (For Reference)

### File Structure
```
mobile/
├── src/
│   └── constants/
│       └── styles.ts                    ← Style definitions with Supabase URLs
├── app/
│   ├── style-select.tsx                 ← PRIMARY: Active style select screen
│   └── style-select-new.tsx             ← Backup (not used)
└── src/
    └── screens/
        └── StyleSelectScreen.tsx        ← Backup (not used)

backend/
└── src/
    └── services/
        └── nanoBanana.ts                ← Style prompts for generation

Supabase Storage:
└── style-previews/
    └── [stylename]/
        └── preview.jpg                  ← All preview images stored here
```

### Critical Files to Update

**MUST UPDATE (Required for style to work):**
1. ✅ `mobile/src/constants/styles.ts` - Style definition
2. ✅ `backend/src/services/nanoBanana.ts` - Generation prompt
3. ✅ `mobile/app/style-select.tsx` - **PRIMARY** category file (actively used)

**OPTIONAL (For consistency):**
4. `mobile/src/screens/StyleSelectScreen.tsx` - Backup file (not used)
5. `mobile/app/style-select-new.tsx` - Backup file (not used)

### Naming Conventions
- **Style Key**: `snake_case` (e.g., `wine_bar`, `with_supercar`)
- **Constant Name**: `SCREAMING_SNAKE_CASE` (e.g., `WINE_BAR_PHOTO_1`)
- **Supabase Path**: `lowercase` (e.g., `winebar/preview.jpg`)
- **Display Name**: `Title Case` (e.g., "Wine Bar", "With Supercar")

### Storage Strategy
- **Preview Images**: Stored in Supabase Storage bucket `style-previews`
- **No Local Assets**: All images use `{ uri: 'https://...' }` format
- **Public URLs**: All preview images are publicly accessible
- **Path Format**: `style-previews/[stylename]/preview.jpg`

### API Integration
- **Replicate API**: `google/nano-banana` model for image generation
- **Supabase Storage**: `style-previews` bucket for preview hosting
- **Backend Endpoint**: `/api/generate` uses prompts from `nanoBanana.ts`
- **Preview Generation**: Uses generic reference face (alternates gender)
- **User Generation**: Uses uploaded user face
- **Reference Images**: Unsplash provides diverse, high-quality reference faces
  - Male references: Professional, diverse, clear facial features
  - Female references: Professional, diverse, clear facial features
  - Alternates between genders for each new style

---

## ✅ Quality Checks (Automated)

Before finalizing, the AI verifies:
- [x] Style key is unique (no conflicts)
- [x] Prompt includes face preservation prefix
- [x] **Preview gender alternates** from previous style (female/male rotation)
- [x] Appropriate reference image selected for gender
- [x] Preview image generated successfully via Replicate
- [x] Preview uploaded to Supabase Storage
- [x] Public URL obtained and working
- [x] Image constant added to styles.ts with Supabase URL
- [x] Style definition added to STYLE_PRESETS
- [x] Backend prompt added to STYLE_PROMPTS
- [x] Style added to category in **mobile/app/style-select.tsx** (PRIMARY)
- [x] Consistency updates to backup files
- [x] Category exists and is valid
- [x] Frontend and backend keys match exactly
- [x] No syntax errors in any modified files
- [x] Temporary files cleaned up

---

## 🚫 What You DON'T Need to Do

- ❌ Write prompts manually
- ❌ Generate preview images yourself
- ❌ Download or upload images manually
- ❌ Edit code files manually
- ❌ Create asset folders
- ❌ Manage Supabase storage
- ❌ Update multiple files manually
- ❌ Worry about naming conventions
- ❌ Check for syntax errors
- ❌ Figure out which files to update
- ❌ Clean up temporary files

---

## 💡 Tips for Best Results

### Style Naming
- Be descriptive: "Wine Bar" > "Bar"
- Be specific: "Coffee Date" > "Date"
- Avoid generic names: "Business Casual" > "Casual"
- Consider searchability: "Luxury Yacht" > "Boat"

### Category Selection
Choose the category that best fits:
- **dating**: Romantic, date-friendly, intimate settings
- **business**: Professional, corporate, formal headshots
- **social_lifestyle**: Casual social situations, hobbies
- **creative**: Artistic, fantasy, character-based
- **adventure**: Outdoor, exploration, nature
- **classy**: Elegant, sophisticated, upscale
- **winter**: Seasonal, holidays, cold weather
- **jobs**: Professional careers, uniforms

### Requesting Changes
If the preview isn't quite right:
- Be specific: "Make the lighting warmer"
- Reference elements: "Change the wine to champagne"
- Suggest alternatives: "Try a rooftop bar instead"
- Adjust mood: "Make it more intimate/romantic"

---

## 🔍 Troubleshooting

### "Style not appearing after reload"
**Solution:**
1. Verify you restarted the app (not just hot reload)
2. Check if the style was added to `mobile/app/style-select.tsx` (PRIMARY file)
3. Clear cache: `npx expo start --clear`
4. Full rebuild: `npx expo run:android`

### "Preview image doesn't load"
**Solution:**
1. Check Supabase URL is correct and accessible
2. Verify image was uploaded successfully
3. Check bucket permissions (should be public)

### "Preview image doesn't match my vision"
**Solution:**
→ Request regeneration with specific changes
→ AI will adjust prompt and regenerate

### "Generated images don't preserve user's face"
**Solution:**
→ This is normal for preview generation (uses generic face)
→ User generation uses their actual uploaded face

### "Style appears in some categories but not others"
**Solution:**
→ This is expected - styles are manually assigned to categories
→ Request to add the style to additional categories if needed

---

## 📝 Summary

**Old Workflow (Manual):**
1. Generate preview image manually
2. Upload to Supabase manually
3. Write detailed prompts
4. Edit 5 different files manually
5. Figure out which files are actually used
6. Test and debug
7. Clean up temporary files
⏱️ Time: 30-60 minutes

**New Workflow (Automated):**
1. Tell AI: "Add [style] to [category]"
2. Review preview image
3. Approve with "yes"
⏱️ Time: 2-3 minutes

---

## 🎯 Key Success Factors

1. **Always update `mobile/app/style-select.tsx`** - This is the PRIMARY active file
2. **Use Supabase Storage** - No local assets, all images hosted on Supabase
3. **Match keys exactly** - Frontend and backend style keys must be identical
4. **Include face preservation** - Every prompt must start with face consistency instructions
5. **Alternate preview genders** - Female/male rotation ensures balanced representation
6. **Test on real device** - Some features (like image loading) work better on real devices
7. **Restart app properly** - Full restart, not just hot reload, to see new styles

---

## 📚 Reference: Complete File List

**Files Modified for Each New Style:**

1. `mobile/src/constants/styles.ts`
   - Add image constant with Supabase URL
   - Add style definition to STYLE_PRESETS

2. `backend/src/services/nanoBanana.ts`
   - Add prompt to STYLE_PROMPTS

3. `mobile/app/style-select.tsx` ⭐ **PRIMARY**
   - Add style key to category's styles array

4. `mobile/src/screens/StyleSelectScreen.tsx` (optional)
   - Add style key for consistency

5. `mobile/app/style-select-new.tsx` (optional)
   - Add style key for consistency

**External Resources:**
- Supabase Storage: `style-previews/[stylename]/preview.jpg`
- Replicate API: Used for initial generation only

---

*Last Updated: January 2026*
*Fully automated workflow with Supabase integration*
*All preview images hosted on Supabase Storage*
