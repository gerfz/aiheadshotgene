# How to Add New Styles to AI Headshot Generator

This guide provides a step-by-step process for adding new portrait styles to the app. Follow these steps in order to ensure everything works on the first try.

---

## 📋 Prerequisites

Before adding a new style, prepare:
- **Style Key**: A unique identifier (e.g., `pikachu`, `business_casual`)
- **Style Name**: Display name for users (e.g., "With Pikachu")
- **Description**: Brief description of the style
- **AI Prompt**: Detailed prompt for image generation
- **Preview Image(s)**: Example photo(s) showing the style result

---

## 🎨 Step 1: Add Assets (Frontend)

### 1.1 Create Asset Folder
```bash
cd mobile/assets
mkdir YourStyleFolder  # Use PascalCase (e.g., Childhood, Business)
```

### 1.2 Add Preview Images
- Place your preview image(s) in the folder
- Supported formats: `.jpg`, `.png`
- Recommended naming: `example1.jpg`, `preview.jpg`, etc.

**Example:**
```
mobile/assets/
  └── Childhood/
      ├── pika.jpg
      ├── tomnjerry.jpg
      ├── benten.jpg
      └── pinkpanther.jpg
```

> ⚠️ **Important**: Folder names are case-sensitive! Use the exact casing in your imports.

---

## 🔧 Step 2: Update Frontend Constants

### 2.1 Edit `mobile/src/constants/styles.ts`

#### A. Import the Images
Add your image imports at the top of the file:

```typescript
// Your Style Category photos
const YOUR_STYLE_PHOTO_1 = require('../../assets/YourStyleFolder/image1.jpg');
const YOUR_STYLE_PHOTO_2 = require('../../assets/YourStyleFolder/image2.jpg');
```

**Example:**
```typescript
// Childhood Character photos
const PIKACHU_PHOTO_1 = require('../../assets/Childhood/pika.jpg');
```

#### B. Add Style Definition
Add your style to the `STYLE_PRESETS` object:

```typescript
export const STYLE_PRESETS: Record<string, StylePreset> = {
  // ... existing styles ...
  
  your_style_key: {
    key: 'your_style_key',
    name: 'Your Style Name',
    description: 'Brief description of your style',
    thumbnail: YOUR_STYLE_PHOTO_1,
    thumbnails: [YOUR_STYLE_PHOTO_1, YOUR_STYLE_PHOTO_2],
    prompt: `Your detailed AI generation prompt here. 
    Always start with: Keep the facial features of the person in the uploaded image exactly consistent. 
    Preserve 100% accuracy of the face from the reference image. Important: do not change the face.
    Then describe the style, clothing, environment, lighting, camera details, etc.`,
    badge: {  // Optional
      label: 'Badge Text',
      type: 'info', // 'info' | 'female' | other custom types
    },
  },
};
```

**Example:**
```typescript
pikachu: {
  key: 'pikachu',
  name: 'With Pikachu',
  description: 'Energetic portrait with giant 3D Pikachu character',
  thumbnail: PIKACHU_PHOTO_1,
  thumbnails: [PIKACHU_PHOTO_1],
  prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, professional fashion photoshoot. The person is wearing an electric yellow knitted sweater, black high-waisted jeans, and white high-top sneakers with black accents...`,
},
```

---

## 🖥️ Step 3: Update Backend Service

### 3.1 Edit `backend/src/services/nanoBanana.ts`

Add your style prompt to the `STYLE_PROMPTS` object:

```typescript
export const STYLE_PROMPTS: Record<string, string> = {
  // ... existing styles ...
  
  your_style_key: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. [Your detailed prompt matching the frontend exactly]`,
};
```

**Example:**
```typescript
export const STYLE_PROMPTS: Record<string, string> = {
  // ... existing styles ...
  
  pikachu: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, professional fashion photoshoot. The person is wearing an electric yellow knitted sweater...`,
};
```

> ⚠️ **Critical**: The `key` in both frontend and backend MUST match exactly!

---

## 📱 Step 4: Add to Category (Optional)

### 4.1 Update `mobile/app/style-select.tsx`

Add your style to an existing category or create a new one:

```typescript
const STATIC_CATEGORIES = [
  {
    id: 'creative',
    name: 'Creative',
    icon: '🎭',
    styles: ['your_style_key', 'victoria_secret', 'custom'],
  },
  // ... other categories
];
```

### 4.2 Update `mobile/src/screens/StyleSelectScreen.tsx`

Mirror the same changes:

```typescript
const CATEGORIES = [
  {
    id: 'creative',
    name: 'Creative',
    icon: '🎭',
    styles: ['your_style_key', 'victoria_secret', 'custom'],
  },
  // ... other categories
];
```

**Example:**
```typescript
{
  id: 'creative',
  name: 'Creative',
  icon: '🎭',
  styles: ['pikachu', 'tom_and_jerry', 'ben_ten', 'pink_panther', 'victoria_secret', 'custom'],
},
```

---

## ✅ Step 5: Testing Checklist

Before deploying, verify:

- [ ] **Asset Import**: Images load without errors
- [ ] **Frontend Preview**: Style appears in the selection screen
- [ ] **Category Display**: Style shows in correct category
- [ ] **Backend Recognition**: No "Unknown style" error
- [ ] **Generation Works**: Test image generation completes successfully
- [ ] **Prompt Quality**: Generated image matches expected style
- [ ] **Face Consistency**: Original face is preserved in output
- [ ] **Mobile Build**: App builds without bundling errors

---

## 🔍 Troubleshooting

### Error: "Unable to resolve asset"
- Check folder name casing (case-sensitive!)
- Verify file exists in the specified path
- Ensure file extension matches (`.jpg` vs `.png`)

### Error: "Unknown style: your_style_key"
- Verify backend `STYLE_PROMPTS` includes your style key
- Ensure frontend and backend keys match exactly
- Restart backend server after changes

### Style not appearing in app
- Check if style is added to a category in both `style-select.tsx` files
- Verify `STYLE_PRESETS` export is correct
- Clear app cache and rebuild

### Generated image doesn't match prompt
- Review prompt wording for clarity
- Add more specific details (clothing, lighting, camera settings)
- Test prompt variations
- Ensure face consistency prefix is included

---

## 📝 Prompt Writing Best Practices

### Essential Components

1. **Face Preservation** (Always start with this):
   ```
   Keep the facial features of the person in the uploaded image exactly consistent. 
   Preserve 100% accuracy of the face from the reference image. 
   Important: do not change the face.
   ```

2. **Clothing Details**:
   - Be specific: colors, materials, style
   - Example: "electric yellow knitted sweater, black high-waisted jeans"

3. **Environment**:
   - Background color/setting
   - Lighting conditions
   - Mood/atmosphere

4. **Photography Details**:
   - Camera type (if relevant)
   - Lens specifications
   - Depth of field

5. **Character/Element Details** (if applicable):
   - Describe 3D characters/props accurately
   - Specify positioning and interaction
   - Include iconic features

### Example Template

```
Keep the facial features of the person in the uploaded image exactly consistent. 
Preserve 100% accuracy of the face from the reference image. 
Important: do not change the face.

Create a [style type] photoshoot. 

CLOTHING: [detailed clothing description]

POSE: [how person is positioned]

EXPRESSION: [facial expression/mood]

SPECIAL ELEMENTS: [any characters, props, or unique elements]

ENVIRONMENT: [background, setting, atmosphere]

LIGHTING: [lighting setup and mood]

CAMERA: [technical camera details]

FINAL NOTES: [any additional quality requirements]
```

---

## 🚀 Quick Reference: Files to Update

| File | Action | Purpose |
|------|--------|---------|
| `mobile/assets/YourFolder/` | Create + Add images | Store preview images |
| `mobile/src/constants/styles.ts` | Import + Define style | Frontend style definition |
| `backend/src/services/nanoBanana.ts` | Add prompt | Backend generation logic |
| `mobile/app/style-select.tsx` | Add to category | Category organization (Expo Router) |
| `mobile/src/screens/StyleSelectScreen.tsx` | Add to category | Category organization (React Navigation) |

---

## 📚 Example: Adding "With Pikachu" Style

### 1. Assets
```
mobile/assets/Childhood/pika.jpg ✓
```

### 2. Frontend Constants
```typescript
// Import
const PIKACHU_PHOTO_1 = require('../../assets/Childhood/pika.jpg');

// Definition
pikachu: {
  key: 'pikachu',
  name: 'With Pikachu',
  description: 'Energetic portrait with giant 3D Pikachu character',
  thumbnail: PIKACHU_PHOTO_1,
  thumbnails: [PIKACHU_PHOTO_1],
  prompt: `Keep the facial features...`,
},
```

### 3. Backend Service
```typescript
pikachu: `Keep the facial features of the person in the uploaded image exactly consistent...`,
```

### 4. Categories
```typescript
{
  id: 'creative',
  name: 'Creative',
  icon: '🎭',
  styles: ['pikachu', 'victoria_secret', 'custom'],
},
```

### 5. Test ✓
- App builds successfully
- Style appears in Creative category
- Generation works without errors
- Face consistency maintained

---

## 🎯 Summary

To add a new style successfully:
1. ✅ Add preview images to `mobile/assets/YourFolder/`
2. ✅ Import images in `mobile/src/constants/styles.ts`
3. ✅ Define style in `STYLE_PRESETS` (frontend)
4. ✅ Add prompt to `STYLE_PROMPTS` (backend)
5. ✅ Add to category in both style-select files
6. ✅ Test thoroughly before deployment

**Key Rule**: Frontend and backend style keys must match EXACTLY!

---

*Last Updated: January 2026*

