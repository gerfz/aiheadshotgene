# Awesome Nano Banana Pro Prompts 🍌

A curated collection of the best Nano Banana prompts from the [awesome-nanobanana-pro](https://github.com/ZeroLu/awesome-nanobanana-pro) repository.

---

## 📖 Table of Contents

1. [Photorealism & Aesthetics](#1-photorealism--aesthetics)
2. [Creative Experiments](#2-creative-experiments)
3. [Education & Knowledge](#3-education--knowledge)
4. [E-commerce & Virtual Studio](#4-e-commerce--virtual-studio)
5. [Workplace & Productivity](#5-workplace--productivity)
6. [Photo Editing & Restoration](#6-photo-editing--restoration)
7. [Interior Design](#7-interior-design)
8. [Social Media & Marketing](#8-social-media--marketing)
9. [Daily Life & Translation](#9-daily-life--translation)
10. [Social Networking & Avatars](#10-social-networking--avatars)

---

## 1. Photorealism & Aesthetics

### 1.1 Hyper-Realistic Crowd Composition
*Handling complex compositions with multiple famous faces and specific lighting.*

```
Create a hyper-realistic, ultra-sharp, full-color large-format image featuring a massive group of celebrities from different eras, all standing together in a single wide cinematic frame. The image must look like a perfectly photographed editorial cover with impeccable lighting, lifelike skin texture, micro-details of hair, pores, reflections, and fabric fibers.

GENERAL STYLE & MOOD: Photorealistic, 8k, shallow depth of field, soft natural fill light + strong golden rim light. High dynamic range, calibrated color grading. Skin tones perfectly accurate. Crisp fabric detail with individual threads visible. Balanced composition, slightly wide-angle lens (35mm), center-weighted. All celebrities interacting naturally, smiling, posing, or conversing. Minimal background noise, but with enough world-building to feel real.

THE ENVIRONMENT: A luxurious open-air rooftop terrace at sunset overlooking a modern city skyline. Elements include: Warm golden light wrapping around silhouettes. Polished marble.
```
*Source: @SebJefferies*

---

### 1.2 2000s Mirror Selfie
*A structured JSON prompt to generate an authentic early-2000s aesthetic with flash photography and nostalgic elements.*

```
{
  "style": "2000s mirror selfie",
  "camera": "disposable camera flash",
  "aesthetic": "nostalgic, grainy, authentic early-2000s",
  "elements": ["mirror reflection", "flash glare", "bathroom setting", "casual pose"]
}
```
*Source: @SebJefferies*

---

## 9. Daily Life & Translation

### 9.1 Menu Translation
*Translates restaurant menus while preserving the original texture and aged look.*

```
Translate the text from Chinese to English. Texture Preservation: Crucial! Maintain the original aged, greasy, and textured look of the wall/paper. The new English text should look like it was written/printed on the same surface, with slight fading or wear to match. Currency: Keep the '¥' symbol and price numbers exactly as they are; do not convert currency. Layout: Align the English translations next to or replacing the Chinese characters naturally.
```
*Source: WeChat Article*

---

### 9.2 Digital Content Localization (Comics/Memes)
*Translates comics or memes by scrubbing text bubbles and replacing content with matching fonts.*

```
Translate the text in the speech bubbles/captions from [Japanese/English] to [Chinese]. Seamless Cleaning: Erase the original text and perfectly fill the background (e.g., the white speech bubble or the colored image background). Style Matching: Render the translated Chinese text using a casual, handwritten-style font (or bold impact font for memes) that matches the aesthetic of the original image. Fit: Ensure the text fits naturally within the bubbles without overcrowding.
```
*Source: WeChat Article*

---

## 10. Social Networking & Avatars

### 10.1 3D Blind Box Style Avatar (Pop Mart Style)
*Converts portraits into cute, C4D-style "Pop Mart" toy characters.*

```
Transform the person in the uploaded photo into a cute 3D Pop Mart style blind box character. Likeness: Keep key features recognizable: [hair color, glasses, hairstyle]. Style: C4D rendering, occlusion render, cute Q-version, soft studio lighting, pastel colors. Background: A simple, solid matte color background (e.g., soft blue). Detail: The character should have a smooth, plastic toy texture with a slight glossy finish. Facing forward, friendly expression.
```
*Source: WeChat Article*

---

### 10.2 Pet Meme Creation
*Turns pet photos into minimalist, hand-drawn funny stickers.*

```
Turn this photo of my [cat/dog] into a funny hand-drawn WeChat sticker. Style: Minimalist ugly-cute line drawing (doodle style). White background. Expression: Exaggerate the animal's expression to look extremely shocked/judgemental/lazy (based on photo). Accessories: Add cute little doodles like sweat drops, question marks, or sparkles around the head. Text: Add handwritten text at the bottom: 'So Dumb'. Ensure the text style is messy and funny.
```
*Source: WeChat Article*

---

### 10.3 Y2K Scrapbook Poster with Multiple Poses
*Create a Y2K-style scrapbook poster with multiple poses.*

```json
{
  "facelock_identity": "true",
  "accuracy": "100%",
  "scene": "Colorful Y2K scrapbook poster aesthetic, vibrant stickers, multiple subjects wearing the same outfit and hairstyle with different poses and cutouts, colorful strokes and lines, frameless collage style. Includes: close-up shot with heart-shape fingers, full-body squatting pose supporting chin while holding a white polaroid camera, mid-shot touching cheek while blowing pink bubblegum, mid-shot smiling elegantly while holding a cat, seated elegantly with one eye winking and peace sign, and mid-shot holding daisy flowers. Holographic textures, pastel gradients, glitter accents, playful doodles, magazine cut-out graphics, chaotic yet balanced layout, extremely artistic and visually engaging",
  "main_subject": {
    "description": "A young Y2K-styled woman as the main focus in the center of the scrapbook collage.",
    "style_pose": "Playful and confident Y2K pose — slight side hip pop, one hand holding a lens-flare keychain, face toward the camera with a cute-cool expression, slight pout, candid early-2000s photo vibe."
  },
  "outfit": {
    "top": "Cropped oversized sweater in pastel color with embroidered patches",
    "bottom": "pastel skirt with a white belt",
    "socks": "White ankle socks with colorful pastel stripes",
    "shoes": "white sneakers",
    "accessories": [
      "Colorful plastic bracelets",
      "Chunky colorful rings",
      "Sparkling belly chain"
    ]
  },
  "hairstyle": {
    "type": "Y2K half-up half-down",
    "details": "Pastel flowers clips, thin front tendrils, wavy dark brown hair with bubblegum-pink tint on the lower strands, iconic early-2000s look."
  },
  "additional_visuals": [
    "Heart, star, and butterfly stickers",
    "Retro sparkles",
    "Polaroid frames",
    "Neon outlines",
    "Doodle borders",
    "Magazine cutout texts: 'SO CUTE!', '199X!', 'GIRL VIBES'",
    "Pastel lighting",
    "Glossy dreamy retro glow",
    "Ultra-aesthetic scrapbook layout"
  ],
  "photography_rendering": {
    "color_grading": "Cinematic neon Y2K",
    "lighting": "Soft flash lighting",
    "skin_texture": "Smooth glossy finish",
    "rendering": "High-detail hyperrealistic Y2K scrapbook tone",
    "quality": "8K",
    "composition": "Perfectly balanced and artistic"
  },
  "negative_prompt": "no realism that breaks Y2K aesthetic, no modern 2020s clothing, no messy composition, no blurry face, no distorted hands, no extra limbs, no face warping, no low resolution, no grain, no muted colors, no watermark, no AI artifacts"
}
```
*Source: Shreya Yadav (@ShreyaYadav___)*

---

### 10.4 Japanese High School Student Snap Photo
*Create a snapshot in the style of a Japanese high school student.*

```
A daily snapshot taken with a low-quality disposable camera. A clumsy photo taken by a Japanese high school student. (Aspect ratio 3:2 is recommended)
```
*Source: SSSS_CRYPTOMAN (@SSSS_CRYPTOMAN)*

---

### 10.5 AI Skin Analysis and Skincare Routine
*Analyze skin and provide routine recommendations.*

```
You are a professional skin analyst and skincare expert.
The user uploads a close-up photo of their face and may add short notes (age, allergies, current routine, pregnancy, etc.). Use ONLY what you see in the image plus the user text.

1. Carefully inspect the skin: shine, pores, redness, blemishes, spots, texture, flaking, fine lines, dark circles, etc.
2. Decide the main skin type: oily, dry, normal, combination, or sensitive.
3. Identify visible issues: acne/breakouts, blackheads/whiteheads, post-acne marks, hyperpigmentation, redness, enlarged pores, uneven texture, dehydration, fine lines, dark circles, puffiness, etc.

RESPONSE FORMAT (very important)

Your answer must be plain text in this exact structure:
1. First, write 3–6 short lines describing the skin and problems, for example:
   • overall skin type and how you know
   • where the main issues appear (forehead, cheeks, nose, chin, jawline, under-eyes)
   • how severe they look (mild / moderate / severe).

2. On a new line, write the word in caps:
SKIN ROUTINE

3. Under SKIN ROUTINE, give at least 5 numbered steps (1., 2., 3., …).
Each step must include:
   • what to do (e.g. "Cleanser", "Treatment serum", "Moisturizer", "Sunscreen", "Night treatment"),
   • product TYPE and key INGREDIENTS to look for (no brand names),
   • when to use it (AM, PM, or both) and how often,
   • 1 short practical instruction (how to apply, how much, any caution).

Focus on over-the-counter products only (no prescription or medical diagnosis).
If acne or irritation looks very severe or infected, clearly but kindly suggest visiting a dermatologist.
Keep the tone supportive, simple and clear.
```
*Source: Saman | AI (@Samann_ai)*

---

## Additional Categories (Visit Repository for Full Prompts)

The [awesome-nanobanana-pro](https://github.com/ZeroLu/awesome-nanobanana-pro) repository also includes prompts for:

- **Creative Experiments**: Photo book style magazine covers, country island dioramas, novel scene posters, miniature swimming pools, Christmas ornaments, surreal wrinkle removal, isometric photography, wide angle edits, shop window cartoons, 3D LED displays, trans-dimensional liquid pours, fisheye portraits, IXUS aesthetic photos, and anime spotlights.
- **Education & Knowledge**: Educational content generation
- **E-commerce & Virtual Studio**: Product photography and virtual studio setups
- **Workplace & Productivity**: Professional content generation
- **Photo Editing & Restoration**: Image enhancement and restoration
- **Interior Design**: Room visualization and design
- **Social Media & Marketing**: Marketing content creation

---

## 🔑 Key Tips for Face Preservation

When generating portraits with Nano Banana, always include these key phrases to maintain face accuracy:

```
Keep the facial features of the person in the uploaded image exactly consistent.
Maintain 100% accuracy of the face from the reference image.
Important: do not change the face.
```

Or use JSON format:
```json
{
  "facelock_identity": "true",
  "accuracy": "100%"
}
```

---

## 📚 Resources

- [Official Prompting Guide](https://github.com/ZeroLu/awesome-nanobanana-pro)
- [Nano Banana Prompts Website](https://nanobananaprompts.com)

---

*Last updated: December 2024*

