# How to Add New Styles to AI Headshot Generator

This guide explains the automated workflow for adding new portrait styles to the app.

---

## 🎯 Quick Start (For User)

To add a new style, simply provide:
1. **Category name** (e.g., `lifestyle`, `creative`, `professional`)
2. **Style name** (e.g., "With Supercar", "Business Casual")

**Example:**
```
Add new style to lifestyle category called "With Supercar"
```

That's it! The AI assistant will handle the rest.

---

## 🤖 Automated Workflow (What Happens Behind the Scenes)

### Step 1: AI Generates the Prompt
Based on the style name and category, the AI creates a detailed generation prompt following best practices:
- Starts with face preservation instructions
- Includes detailed clothing, environment, lighting descriptions
- Optimized for high-quality, realistic results

### Step 2: Generate Preview Image
The AI calls the Replicate API (Nano Banana model) to generate a preview image using:
- A random reference face (not the user's face)
- The generated prompt
- Standard generation parameters

### Step 3: Review & Approval
The AI presents:
- 🖼️ **Preview image URL** for review
- 📝 **Generated prompt** for verification

**User responds:**
- ✅ "yes" / "approve" / "looks good" → Proceed to Step 4
- ❌ "no" / "regenerate" → AI adjusts prompt and regenerates
- 🔧 "change [aspect]" → AI modifies specific parts and regenerates

### Step 4: Automated Integration
Once approved, the AI automatically:

#### A. Create Asset Folder
```bash
mobile/assets/[StyleName]/
  └── preview.jpg
```

#### B. Download & Place Image
- Downloads the approved preview image
- Saves it to the asset folder

#### C. Update Frontend Constants
File: `mobile/src/constants/styles.ts`

Adds:
```typescript
// Import
const [STYLE]_PHOTO_1 = require('../../assets/[StyleName]/preview.jpg');

// Style definition
[style_key]: {
  key: '[style_key]',
  name: '[Style Name]',
  description: '[Auto-generated description]',
  thumbnail: [STYLE]_PHOTO_1,
  thumbnails: [[STYLE]_PHOTO_1],
  prompt: `[Generated prompt with face preservation]`,
},
```

#### D. Update Backend Service
File: `backend/src/services/nanoBanana.ts`

Adds:
```typescript
[style_key]: `[Same prompt as frontend]`,
```

#### E. Add to Category
Files: 
- `mobile/app/style-select-new.tsx`
- `mobile/src/screens/StyleSelectScreen.tsx`

Updates the specified category's `styles` array:
```typescript
{
  id: 'lifestyle',
  name: 'Lifestyle',
  icon: '🌟',
  styles: ['existing_style', '[new_style_key]'], // ✅ Added here
},
```

### Step 5: Confirmation
The AI confirms completion with:
- ✅ Files modified
- ✅ Style key used
- ✅ Category updated
- 📱 Reminder to rebuild the app

---

## 📋 Available Categories

Current categories in the app:
- `lifestyle` - Social & Lifestyle (🌟)
- `creative` - Creative & Artistic (🎭)
- `professional` - Professional & Business (💼)
- `fashion` - Fashion & Style (👗)
- `seasonal` - Seasonal & Events (🎄)

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
- Lighting setup
- Camera specifications
- Photo quality requirements
- Artistic style notes

### 4. Context-Aware Generation
The AI considers:
- Category theme (lifestyle vs professional vs creative)
- Style name implications
- Current trends and popular styles
- Consistency with existing styles

---

## 🔄 Example Workflow

**User Request:**
```
Add new style to lifestyle category called "With Supercar"
```

**AI Response:**
```
🎨 Generating style "With Supercar" for lifestyle category...

📝 Generated Prompt:
Keep the facial features of the person in the uploaded image exactly consistent. 
Preserve 100% accuracy of the face from the reference image. Important: do not 
change the face. Create a hyper-realistic, professional fashion photoshoot. The 
person is standing next to a sleek, futuristic Lamborghini in a vibrant, neon-lit 
cityscape at dusk...

🖼️ Generating preview image...

Preview Image: https://replicate.delivery/pbxt/abc123.jpg

Please review and respond:
- Type "yes" to approve and proceed
- Type "no" to regenerate with adjustments
- Type "change [aspect]" to modify specific elements
```

**User:**
```
yes
```

**AI:**
```
✅ Approved! Integrating style into the app...

✅ Created: mobile/assets/WithSupercar/preview.jpg
✅ Updated: mobile/src/constants/styles.ts
✅ Updated: backend/src/services/nanoBanana.ts
✅ Updated: mobile/app/style-select-new.tsx
✅ Updated: mobile/src/screens/StyleSelectScreen.tsx

Style Key: with_supercar
Category: lifestyle (Social & Lifestyle)

📱 Next Step: Rebuild your app to see the new style!
```

---

## 🛠️ Technical Details (For Reference)

### File Structure
```
mobile/
├── assets/
│   └── [StyleName]/
│       └── preview.jpg
├── src/
│   └── constants/
│       └── styles.ts
├── app/
│   └── style-select-new.tsx
└── src/
    └── screens/
        └── StyleSelectScreen.tsx

backend/
└── src/
    └── services/
        └── nanoBanana.ts
```

### Naming Conventions
- **Style Key**: `snake_case` (e.g., `with_supercar`)
- **Constant Name**: `SCREAMING_SNAKE_CASE` (e.g., `WITH_SUPERCAR_PHOTO_1`)
- **Folder Name**: `PascalCase` (e.g., `WithSupercar`)
- **Display Name**: `Title Case` (e.g., "With Supercar")

### API Integration
- **Endpoint**: Backend `/api/generate` (Nano Banana via Replicate)
- **Model**: `nano-banana` (face-preserving portrait generation)
- **Preview Generation**: Uses random reference face
- **User Generation**: Uses uploaded user face

---

## ✅ Quality Checks (Automated)

Before finalizing, the AI verifies:
- [ ] Style key is unique (no conflicts)
- [ ] Prompt includes face preservation
- [ ] Preview image generated successfully
- [ ] All files updated correctly
- [ ] Category exists and is valid
- [ ] Frontend and backend keys match
- [ ] No syntax errors in code

---

## 🚫 What You DON'T Need to Do

- ❌ Write prompts manually
- ❌ Generate preview images yourself
- ❌ Edit code files
- ❌ Create asset folders
- ❌ Download or place images
- ❌ Update multiple files
- ❌ Worry about naming conventions
- ❌ Check for syntax errors

---

## 💡 Tips for Best Results

### Style Naming
- Be descriptive: "With Supercar" > "Car"
- Avoid generic names: "Business Casual" > "Casual"
- Consider searchability: "Luxury Yacht" > "Boat"

### Category Selection
Choose the category that best fits:
- **Lifestyle**: Social situations, hobbies, luxury items
- **Creative**: Artistic, fantasy, character-based
- **Professional**: Business, corporate, formal
- **Fashion**: Clothing-focused, runway, editorial
- **Seasonal**: Holidays, events, seasonal themes

### Requesting Changes
If the preview isn't quite right:
- Be specific: "Make the lighting warmer"
- Reference elements: "Change the car to red"
- Suggest alternatives: "Try a different background"

---

## 🔍 Troubleshooting

### "Preview image doesn't match my vision"
→ Request regeneration with specific changes

### "Style not appearing after rebuild"
→ AI will verify all files were updated correctly

### "Generated images don't preserve user's face"
→ This is normal for preview generation; user generation uses their actual face

---

## 📝 Summary

**Old Workflow (Manual):**
1. Create folders
2. Find/create preview images
3. Write prompts
4. Edit 5 different files
5. Test and debug
⏱️ Time: 30-60 minutes

**New Workflow (Automated):**
1. Tell AI: "Add [style] to [category]"
2. Review preview
3. Approve
⏱️ Time: 2-3 minutes

---

*Last Updated: January 2026*
*Automated workflow powered by AI assistant*
