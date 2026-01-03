import Replicate from 'replicate';
import dotenv from 'dotenv';

dotenv.config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

console.log('Replicate initialized with token:', process.env.REPLICATE_API_TOKEN ? `Yes (Length: ${process.env.REPLICATE_API_TOKEN.length})` : 'No');
if (process.env.REPLICATE_API_TOKEN && !process.env.REPLICATE_API_TOKEN.startsWith('r8_')) {
  console.warn('WARNING: Replicate token does not start with "r8_". It might be invalid.');
}

// The Nano Banana model on Replicate
const MODEL_ID = 'google/nano-banana';

// Face consistency prefix for custom prompts
export const FACE_CONSISTENCY_PREFIX = `Keep the facial features of the person in the uploaded image exactly consistent. Maintain 100% accuracy of the face from the reference image. Important: do not change the face. `;

// Edit prefix for refining existing portraits
export const EDIT_PREFIX = `Keep the person's face EXACTLY the same as in the uploaded image. Do not change any facial features, identity, or face structure. Only apply the following specific changes: `;

// Style prompts for professional headshots
export const STYLE_PROMPTS: Record<string, string> = {
  // Business Photo style
  business: `Keep the facial features of the person in the uploaded image exactly consistent. Dress them in a professional navy blue business suit with a white shirt, similar to the reference image. Background: Place the subject against a clean, solid dark gray studio photography backdrop. The background should have a subtle gradient, slightly lighter behind the subject and darker towards the edges (vignette effect). There should be no other objects. Photography Style: Shot on a Sony A7III with an 85mm f/1.4 lens, creating a flattering portrait compression. Lighting: Use a classic three-point lighting setup. The main key light should create soft, defining shadows on the face. A subtle rim light should separate the subject's shoulders and hair from the dark background. Crucial Details: Render natural skin texture with visible pores, not an airbrushed look. Add natural catchlights to the eyes. The fabric of the suit should show a subtle wool texture. Final image should be an ultra-realistic, 8k professional headshot.`,

  // Cinematic Tight Portrait
  tight_portrait: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a tight portrait crop from upper torso to head in vertical orientation. Composition: Subject placed slightly right of center with shoulders angled and head turned toward camera at eye-level. Shallow depth of field with smooth background falloff. Soft negative space on left side created by gradient background. Subject: Three-quarter profile with subtle head tilt. Serious, confident, introspective expression with gaze directed slightly past the camera. Sharp jawline, defined cheekbones, light stubble. Short, dark, neatly styled hair with slight texture. High-detail skin with visible pores and natural highlights. Wardrobe: Black or very dark charcoal knit zip-up sweater with heavy ribbed knit fabric texture. Slim fit with high collar partially zipped. Minimalist, modern, masculine style. Lighting: Strong directional light from front-left with minimal fill allowing deep shadows. Subtle rim light for edge separation along jaw and shoulder. High contrast with dramatic shadow sculpting. Soft but directional, cinematic light quality with controlled specular highlights on skin. Color Palette: Deep red, burgundy, and black dominant colors. Warm, slightly desaturated skin tones. Moody and cinematic overall tone with warm shadows and subtle red cast color grading. Background: Dark red gradient studio backdrop with smooth texture and soft light diffusion. Clear subject-background separation via lighting and contrast. Technical: Short telephoto portrait lens look (85mm equivalent). Wide aperture style (f/1.8–f/2.8). High facial sharpness with smooth background blur. Minimal noise, clean studio image with controlled highlights and rich shadows. Artistic Style: Fashion portrait / cinematic editorial genre. Intense, refined, dramatic mood. Luxury, high-fashion, modern masculinity aesthetic with cinematic lighting influences. Post-Processing: Subtle skin retouching preserving texture. Enhanced midtone contrast. Warm red-toned grade with muted saturation. Very subtle edge darkening vignette.`,

  // Luxury Fashion Editorial
  luxury_fashion: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Design a dark, cinematic portrait featuring a powerful, refined alpha male with luxury fashion editorial lighting and a moody, romantic tone. Subject: Handsome alpha male with dominant, controlled, mysterious presence. Facial features: Smoldering, intense, restrained expression. Gaze looking downward, partially obscured by shadow. Clean, smooth skin with no tattoos. High-detail facial structure. Pose: Adjusting the cufflink on one sleeve of white dress shirt. Body language: Confident, composed, quietly powerful. Wardrobe: Sharp tailored black suit, crisp white dress shirt, dark tie. Luxury, classic, high-status mafia aesthetic. Scene and Background: Pure black background. Minimalist studio setup. Dark, moody, seductive, elite atmosphere. Lighting: Cinematic soft directional lighting angled to sculpt the face and suit. Very subtle fill to preserve shadow depth. Face partially in shadow with smooth tonal transitions. Continuous tonal gradients across the face. Intense, luxurious, emotionally charged mood. Composition: Medium portrait framing from torso to head. Centered composition with strong vertical symmetry. Subject perfectly centered in frame. Ample dark space around subject. Photography Style: Luxury fashion editorial / cinematic portrait. Dark mafia romance aesthetic. High-end studio photography. Color and Grading: Deep blacks, charcoal shadows, soft neutral skin tones, clean white highlights. Low-key cinematic grading with controlled highlights and deep blacks. Detail: High-detail suit texture and fabric folds. Photorealistic, film-quality realism. Polished, premium quality finish.`,

  // Emotional Film Photography style
  emotional_film: `Keep the facial features of the person in the uploaded image exactly consistent. Style: A cinematic, emotional portrait shot on Kodak Portra 400 film. Setting: An urban street coffee shop window at Golden Hour (sunset). Warm, nostalgic lighting hitting the side of the face. Atmosphere: Apply a subtle film grain and soft focus to create a dreamy, storytelling vibe. Action: The person is looking slightly away from the camera, holding a coffee cup, with a relaxed, candid expression. Details: High quality, depth of field, bokeh background of city lights.`,

  // Victoria's Secret Photoshoot style
  victoria_secret: `Create a glamorous photoshoot in the style of Victoria's Secret. The person in the uploaded reference image (Keep the face of the person 100% accurate from the reference image) stands almost sideways, slightly bent forward, during the final preparation for the show. Makeup artists apply lipstick (only their hands are visible in the frame). The person is wearing a corset decorated with beaded embroidery and crystals with a short fluffy skirt, as well as large feather wings. The image has a "backstage" effect. The background is a darkly lit room, probably under the podium. The main emphasis is on the person's face and the details of the costume. Emphasize the expressiveness of the gaze and the luxurious look of the outfit. The photo is lit by a flash from the camera, which emphasizes the shine of the beads and crystals on the corset, as well as the shiny skin. Victoria's Secret style: sensuality, luxury, glamour. Very detailed. Important: do not change the face.`,

  // 1990s Camera Style
  nineties_camera: `Without changing their original face, create a portrait of a beautiful person with porcelain-white skin, captured with a 1990s-style camera using a direct front flash. Her messy dark brown hair is tied up, posing with a calm yet playful smile. She wears a modern oversized cream sweater. The background is a dark white wall covered with aesthetic magazine posters and stickers, evoking a cozy bedroom or personal room atmosphere under dim lighting. The 35mm lens flash creates a nostalgic glow.`,

  // Professional Headshot
  professional_headshot: `A professional, high-resolution profile photo, maintaining the exact facial structure, identity, and key features of the person in the input image. The subject is framed from the chest up, with ample headroom. The person looks directly at the camera. They are styled for a professional photo studio shoot, wearing a premium smart casual blazer in a subtle charcoal gray. The background is a solid '#562226' neutral studio color. Shot from a high angle with bright and airy soft, diffused studio lighting, gently illuminating the face and creating a subtle catchlight in the eyes, conveying a sense of clarity. Captured on an 85mm f/1.8 lens with a shallow depth of field, exquisite focus on the eyes, and beautiful, soft bokeh. Observe crisp detail on the fabric texture of the blazer, individual strands of hair, and natural, realistic skin texture. The atmosphere exudes confidence, professionalism, and approachability. Clean and bright cinematic color grading with subtle warmth and balanced tones, ensuring a polished and contemporary feel.`,

  // With Puppy
  with_puppy: `The person's facial features, expression, and identity must remain exactly the same as the reference image. Preserve the original face completely. The person is outdoors in a winter scene, puckering their lips toward the camera in a playful, cute expression. They are wearing a black hooded sweatshirt and holding a small white puppy with light blue eyes. The puppy has a calm expression, looking forward. Environment: outdoors in a winter scene with snow covering the ground, bare trees in the background, and a blurred vehicle behind the person. The sky is a clear light blue. Mood: cute, natural, winter outdoor moment. Camera style: soft depth of field, natural daylight, subtle winter tones. The composition captures a heartwarming moment between the person and the adorable puppy.`,

  // With Pikachu
  pikachu: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, professional fashion photoshoot. The person is wearing an electric yellow knitted sweater, black high-waisted jeans, and white high-top sneakers with black accents. The person is standing casually with their arm resting on a giant 3D photorealistic Pikachu character beside them. Pikachu should be rendered in ultra-realistic 3D with accurate proportions, textures, and the iconic red cheeks, smiling up at the person with a cheerful expression. The person has an energetic, cheerful expression. Environment: vibrant yellow backdrop with professional studio lighting. The lighting creates soft shadows and highlights the texture of the knitted sweater. Camera: Shot on a high-end fashion camera with shallow depth of field. The composition captures a fun, playful interaction between the person and the beloved Pokémon character in a modern, stylish photoshoot aesthetic.`,

  // With Tom & Jerry
  tom_and_jerry: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, professional fashion photoshoot. The person is wearing a light grey knitted sweater, blue high-waisted jeans, and white high-top sneakers. The person is standing with their arm around a giant 3D photorealistic Tom Cat character. Tom should be rendered in ultra-realistic 3D while maintaining his iconic cartoon appearance - grey and white fur, posing confidently with a mischievous smirk. On Tom's shoulder sits Jerry Mouse, also in 3D photorealistic style with his characteristic brown fur and playful expression. The person has a fun, mischievous expression. Environment: clean grey-blue backdrop with professional studio lighting. Camera: Shot on a high-end fashion camera with perfect focus on all three subjects. The composition captures the playful dynamic between the person and the classic cartoon duo in a modern photoshoot style.`,

  // With Ben 10
  ben_ten: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, professional fashion photoshoot with sci-fi hero aesthetics. The person is wearing a Ben 10 themed green and black sweater, dark grey jeans, and white sneakers with green accents. The person is standing confidently beside a giant 3D photorealistic render of Ben Tennyson (Classic Ben 10 character) who is activating his Omnitrix. Ben should be rendered in ultra-realistic 3D with cartoon accuracy - wearing his iconic green jacket with the number 10, black shirt, cargo pants, and the glowing green Omnitrix device on his wrist. The Omnitrix emits a dynamic bright green glow. The person has a confident, energetic expression. Environment: neon-green and black circuitry patterns backdrop, with dynamic green glow reflecting from the Omnitrix onto both subjects. The lighting creates a sci-fi hero fashion shoot mood. Camera: Shot on a high-end fashion camera with professional lighting that emphasizes the dramatic green glow. The composition captures an action-ready, superhero-inspired moment.`,

  // With Pink Panther
  pink_panther: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, professional fashion photoshoot. The person is wearing a pastel pink knitted sweater, white high-waisted jeans, and white sneakers with pink accents. The person is posing fashionably beside a tall giant 3D photorealistic Pink Panther character. The Pink Panther should be rendered in ultra-realistic 3D with accurate iconic features - bright pink fur, elongated body, distinctive snout, and characteristic cool, suave posture striking a stylish pose with one paw raised. The person has an elegant, stylish expression. Environment: light pastel pink backdrop with soft, flattering professional studio lighting. The lighting creates a dreamy, fashionable atmosphere. Camera: Shot on a high-end fashion camera with shallow depth of field and perfect focus. The composition captures a sophisticated, fashion-forward moment with the legendary cool character in a modern editorial style.`,

  // With Bulbasaur
  bulbasaur: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, premium studio fashion shoot with designer-toy finish. The person is wearing a mint-green knitted sweater, off-white high-waisted jeans, and white high-top sneakers with subtle green accents. The person is standing with one hand naturally resting near the bud area on a giant 3D photorealistic Bulbasaur (not covering faces), the other hand lightly on the waist. The person has a playful, lively, mischievous smile. Bulbasaur should be rendered as a giant 3D photorealistic character with a cute yet realistic, premium vinyl-toy look - clean skin micro-texture, refined bud material detail, clear glossy eyes, and crisp silhouette. Bulbasaur tilts its head up slightly toward the person with a gentle, friendly photo-op vibe. Environment: clean mint gradient studio backdrop, minimal. Lighting: soft key light plus subtle rim light, porcelain-fair clean skin rendering, crisp shadows. Composition: full-body or 3/4 fashion-ad framing with generous negative space, premium street-editorial vibe.`,

  // With Charmander
  charmander: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, premium studio fashion shoot with designer-toy finish. The person is wearing a vibrant orange-red knitted sweater, deep black high-waisted jeans, and white high-top sneakers with subtle orange accents. The person is standing with their arm casually leaning on a giant 3D photorealistic Charmander's shoulder or back area, body slightly angled for a stronger silhouette. The person has an energetic, confident, cheeky smile. Charmander should be rendered as a giant 3D photorealistic character with controlled warm glow accents - refined skin detail, tail flame realistic but not overpowering, clear glossy eyes. Charmander wears a proud expression, and the tail flame adds a subtle warm rim-light reflection on the person. Environment: high-saturation orange-red gradient backdrop, minimal fashion studio. Lighting: studio key light plus subtle warm rim from tail flame, clean premium finish. Composition: 3/4 body framing with bold color-block impact, commercial fashion vibe.`,

  // With Squirtle
  squirtle: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, premium studio fashion shoot with designer-toy finish. The person is wearing a sea-salt blue knitted sweater, light grey high-waisted jeans, and white high-top sneakers with subtle blue accents. The person is standing with one hand lightly resting on the edge of a giant 3D photorealistic Squirtle's shell, the other hand relaxed. The person has a fresh, cute, slightly cool expression. Squirtle should be rendered as a giant 3D photorealistic character with a glossy-toy yet realistic finish - premium semi-gloss shell material, clean skin micro-detail, clear glossy eyes. Squirtle holds a relaxed signature smile pose, creating a crisp monochrome duo aesthetic. Environment: clean light-blue gradient studio backdrop, minimal. Lighting: soft key light plus delicate rim, porcelain-fair clean skin rendering. Composition: full-body or 3/4 framing with airy negative space, refined clean look.`,

  // With Jigglypuff
  jigglypuff: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, soft pastel editorial, premium studio fashion shoot. The person is wearing a pastel lavender-pink knitted sweater, creamy off-white high-waisted jeans, and white/pink high-top sneakers. The person is in a stylish standing pose, gently leaning beside a giant 3D photorealistic Jigglypuff. Jigglypuff does a cute photo gesture with a small wave or hands-on-cheeks. The person has a soft, sweet, elegant expression. Jigglypuff should be rendered as a giant 3D photorealistic character with a premium plush-toy vibe - subtle fuzzy surface, clean noise-free finish, clear glossy eyes, high-end designer-toy look. Jigglypuff smiles and waves slightly, creating a cute-yet-premium duo mood. Environment: light pastel lavender-pink gradient backdrop with extremely subtle paper-like texture. Lighting: diffused soft light, clean translucent skin rendering, airy mood. Composition: magazine-cover style framing with generous negative space, refined sweetness.`,

  // Zootopia Cable Car
  zootopia_cable_car: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a cozy, cinematic winter scene inside a glass cable car in the Swiss Alps. The person is wearing a red knit sweater and blue jeans, sitting on a wooden bench, smiling softly at the camera with long dark hair and a warm, natural look. On the person's left, Nick Wilde from Zootopia, the sly red fox character, leans in relaxed wearing his green shirt and striped tie with a confident smirk. On the person's right, Judy Hopps from Zootopia, the cheerful gray rabbit police officer in her blue uniform, sits close with an energetic, friendly expression. The person has their arms around both characters, creating a wholesome, affectionate moment. Nick Wilde and Judy Hopps should be rendered as high-quality photorealistic 3D animated characters that blend seamlessly with the real person. Outside the cable car window, snow-covered mountains stretch into the distance under a clear blue sky, with a red alpine train crossing a stone bridge in the background. Environment: bright natural daylight, crisp winter atmosphere, ultra-detailed glass cable car interior with wooden benches. Lighting: soft natural light from windows, gentle shadows. Composition: cozy travel aesthetic with sharp focus, 4:5 aspect ratio, high resolution. The scene should feel warm and wholesome despite the cold winter setting outside.`,

  // Legacy styles (keep for backwards compatibility)
  corporate: `Keep the facial features of the person in the uploaded image exactly consistent. Dress them in a professional navy blue business suit with a white shirt, similar to a corporate executive. Background: Place the subject against a clean, solid dark gray studio photography backdrop. The background should have a subtle gradient, slightly lighter behind the subject and darker towards the edges (vignette effect). There should be no other objects. Photography Style: Shot on a Sony A7III with an 85mm f/1.4 lens, creating a flattering portrait compression. Lighting: Use a classic three-point lighting setup. The main key light should create soft, defining shadows on the face. A subtle rim light should separate the subject's shoulders and hair from the dark background. Crucial Details: Render natural skin texture with visible pores, not an airbrushed look. Add natural catchlights to the eyes. The fabric of the suit should show a subtle wool texture. Final image should be an ultra-realistic, 8k professional headshot.`,

  creative: `Keep the facial features of the person in the uploaded image exactly consistent. Dress them in smart casual attire - a well-fitted blazer over a quality solid-color t-shirt. Background: Modern minimalist office or creative studio environment with soft natural window light. Blurred background with subtle hints of contemporary furniture or plants. Photography Style: Shot on a Canon EOS R5 with a 50mm f/1.2 lens for a natural perspective. Lighting: Soft, diffused window lighting from one side, creating gentle shadows and a warm, approachable feel. Crucial Details: Natural, relaxed expression. Authentic skin texture with a healthy glow. Modern, editorial style portrait suitable for creative industry professionals. Colors should be warm and inviting. Final image should be high-quality editorial portrait.`,

  friendly: `Keep the facial features of the person in the uploaded image exactly consistent. Dress them in a light blue oxford shirt, no jacket - professional yet approachable. Background: Warm neutral background with a soft, seamless gradient. Cream to light tan tones. Photography Style: Shot on a Nikon Z8 with an 85mm f/1.8 lens for flattering compression. Lighting: Soft, diffused key light creating minimal shadows. Fill light for an even, welcoming look. A subtle warmth in the lighting temperature. Crucial Details: Genuine, warm smile showing approachability. Natural skin tones with warm undertones. Eyes should have clear catchlights and appear engaged. Professional yet friendly headshot perfect for LinkedIn or company profiles. Final image should be a professional, approachable headshot.`
};

export async function generatePortrait(
  imageBase64: string,
  styleKey: string,
  mimeType: string = 'image/jpeg',
  customPrompt?: string,
  editPrompt?: string
): Promise<string> {
  let prompt: string;
  
  // If edit mode, use edit prefix with the edit prompt
  if (styleKey === 'edit' && editPrompt) {
    prompt = EDIT_PREFIX + editPrompt;
  }
  // If custom style, require custom prompt
  else if (styleKey === 'custom') {
    if (!customPrompt || customPrompt.trim().length === 0) {
      throw new Error('Custom prompt is required for custom style');
    }
    prompt = FACE_CONSISTENCY_PREFIX + customPrompt;
  } else {
    // Use predefined style prompt
    prompt = STYLE_PROMPTS[styleKey];
    if (!prompt) {
      throw new Error(`Unknown style: ${styleKey}`);
    }
  }

  try {
    // Convert base64 to data URI for Replicate
    const imageDataUri = `data:${mimeType};base64,${imageBase64}`;

    console.log('Starting Replicate generation with nano-banana...');
    console.log('Style:', styleKey);

    // Run the Nano Banana model on Replicate
    // Using the correct parameters for nano-banana
    const output = await replicate.run(MODEL_ID as `${string}/${string}`, {
      input: {
        prompt: prompt,
        image_input: [imageDataUri], // nano-banana expects image_input as array
        aspect_ratio: "match_input_image",
        output_format: "jpg"
      }
    });

    console.log('Replicate output type:', typeof output);
    console.log('Replicate output:', output);

    // Handle streaming output from Replicate (Uint8Array chunks)
    if (output && Symbol.asyncIterator in Object(output)) {
      console.log('Handling async iterator output...');
      const chunks: Uint8Array[] = [];
      for await (const chunk of output as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      // Combine all chunks into a single buffer
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      const base64 = Buffer.from(combined).toString('base64');
      console.log('Generated base64 length:', base64.length);
      return base64;
    }

    // Handle array output (URLs)
    if (Array.isArray(output) && output.length > 0) {
      console.log('Handling array output...');
      const resultUrl = output[0];
      const response = await fetch(resultUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return base64;
    }

    // Handle string output (URL)
    if (typeof output === 'string') {
      console.log('Handling string output...');
      const response = await fetch(output);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return base64;
    }

    // Handle object with output property
    if (output && typeof output === 'object' && 'output' in output) {
      console.log('Handling object output...');
      const resultUrl = (output as any).output;
      const response = await fetch(resultUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return base64;
    }

    console.error('Unhandled output format:', output);
    throw new Error('Unexpected output format from Replicate');
  } catch (error: any) {
    // Sanitize error logging to avoid leaking tokens
    console.error('Replicate generation error:', error.message);
    if (error.response) {
      console.error('Replicate API Status:', error.response.status, error.response.statusText);
    }
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

export function getAvailableStyles() {
  // Only return the main 3 styles, not legacy ones
  const mainStyles = ['business', 'emotional_film', 'victoria_secret'];
  
  return mainStyles.map(key => ({
    key,
    name: getStyleName(key),
    description: getStyleDescription(key)
  }));
}

function getStyleName(styleKey: string): string {
  const names: Record<string, string> = {
    business: 'Business Photo',
    emotional_film: 'Emotional Film Photography',
    victoria_secret: "Victoria's Secret Photoshoot",
    corporate: 'Corporate Executive',
    creative: 'Creative Professional',
    friendly: 'Friendly Business'
  };
  return names[styleKey] || styleKey;
}

function getStyleDescription(styleKey: string): string {
  const descriptions: Record<string, string> = {
    business: 'Professional corporate headshot - perfect for LinkedIn and company profiles',
    emotional_film: 'Cinematic film look with rich colors and emotional depth',
    victoria_secret: 'Glamorous high-fashion runway and editorial style',
    corporate: 'Professional navy suit with studio backdrop - perfect for executives',
    creative: 'Smart casual with modern office setting - ideal for creative professionals',
    friendly: 'Approachable oxford shirt look - great for LinkedIn and team pages'
  };
  return descriptions[styleKey] || '';
}
