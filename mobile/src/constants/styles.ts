import { StylePreset } from '../types';

// Business photos
const BUSINESS_PHOTO_1 = require('../../assets/business/518559229-793ad242-7867-4709-bdc6-55021f5eb78f.png');

// Emotional Film photos
const FILM_PHOTO_1 = require('../../assets/emotionalfilm/518559958-243d1b11-9ef0-4d4f-b308-97d67b5d3bc3.png');

// Victoria's Secret photos
const VS_PHOTO_1 = require('../../assets/victoriasecret/G6TSEqzWYAIvaf9.jpg');
const VS_PHOTO_2 = require('../../assets/victoriasecret/G6TSEscXQAAm3Lo.jpg');
const VS_PHOTO_3 = require('../../assets/victoriasecret/G6TSEuEWEAAaR7N.jpg');

// 1990s Camera Style photos
const NINETIES_PHOTO_1 = require('../../assets/1990s camera style/example1.png');

// Professional Headshot photos
const PROFESSIONAL_HEADSHOT_1 = require('../../assets/professionalheadshot/example1.png');

// With Puppy photos
const PUPPY_PHOTO_1 = require('../../assets/withpuppy/example1.png');

// Childhood Character photos
const PIKACHU_PHOTO_1 = require('../../assets/Childhood/pika.jpg');
const TOM_AND_JERRY_PHOTO_1 = require('../../assets/Childhood/tomnjerry.jpg');
const BEN_TEN_PHOTO_1 = require('../../assets/Childhood/benten.jpg');
const PINK_PANTHER_PHOTO_1 = require('../../assets/Childhood/pinkpanther.jpg');

// Face consistency prefix that will be added to all custom prompts
export const FACE_CONSISTENCY_PREFIX = `Keep the facial features of the person in the uploaded image exactly consistent. Maintain 100% accuracy of the face from the reference image. Important: do not change the face. `;

export const STYLE_PRESETS: Record<string, StylePreset> = {
  custom: {
    key: 'custom',
    name: 'Custom Style',
    description: 'Create your own unique portrait with a custom prompt',
    thumbnail: { uri: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop' }, // Abstract colorful gradient
    prompt: '', // Will be filled with user's custom prompt
    isCustom: true,
    badge: {
      label: 'Your Idea',
      type: 'info',
    },
  },
  business: {
    key: 'business',
    name: 'Business Photo',
    description: 'Professional corporate headshot - perfect for LinkedIn and company profiles',
    thumbnail: BUSINESS_PHOTO_1,
    thumbnails: [BUSINESS_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Dress them in a professional navy blue business suit with a white shirt, similar to the reference image. Background: Place the subject against a clean, solid dark gray studio photography backdrop. The background should have a subtle gradient, slightly lighter behind the subject and darker towards the edges (vignette effect). There should be no other objects. Photography Style: Shot on a Sony A7III with an 85mm f/1.4 lens, creating a flattering portrait compression. Lighting: Use a classic three-point lighting setup. The main key light should create soft, defining shadows on the face. A subtle rim light should separate the subject's shoulders and hair from the dark background. Crucial Details: Render natural skin texture with visible pores, not an airbrushed look. Add natural catchlights to the eyes. The fabric of the suit should show a subtle wool texture. Final image should be an ultra-realistic, 8k professional headshot.`
  },
  emotional_film: {
    key: 'emotional_film',
    name: 'Emotional Film Photography',
    description: 'Cinematic film look with rich colors and emotional depth',
    thumbnail: FILM_PHOTO_1,
    thumbnails: [FILM_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Style: A cinematic, emotional portrait shot on Kodak Portra 400 film. Setting: An urban street coffee shop window at Golden Hour (sunset). Warm, nostalgic lighting hitting the side of the face. Atmosphere: Apply a subtle film grain and soft focus to create a dreamy, storytelling vibe. Action: The subject is looking slightly away from the camera, holding a coffee cup, with a relaxed, candid expression. Details: High quality, depth of field, bokeh background of city lights.`
  },
  victoria_secret: {
    key: 'victoria_secret',
    name: "Victoria's Secret Photoshoot",
    description: 'Glamorous high-fashion runway and editorial style',
    thumbnail: VS_PHOTO_1,
    thumbnails: [VS_PHOTO_1, VS_PHOTO_2, VS_PHOTO_3],
    badge: {
      label: 'Female Only',
      type: 'female',
    },
    prompt: `Create a glamorous photoshoot in the style of Victoria's Secret. A young woman attached in the uploaded reference image (Keep the face of the person 100% accurate from the reference image) stands almost sideways, slightly bent forward, during the final preparation for the show. Makeup artists apply lipstick to her (only her hands are visible in the frame). She is wearing a corset decorated with beaded embroidery and crystals with a short fluffy skirt, as well as large feather wings. The image has a "backstage" effect. The background is a darkly lit room, probably under the podium. The main emphasis is on the girl's face and the details of her costume. Emphasize the expressiveness of the gaze and the luxurious look of the outfit. The photo is lit by a flash from the camera, which emphasizes the shine of the beads and crystals on the corset, as well as the girl's shiny skin. Victoria's Secret style: sensuality, luxury, glamour. Very detailed. Important: do not change the face.`
  },
  nineties_camera: {
    key: 'nineties_camera',
    name: '1990s Camera Style',
    description: 'Nostalgic 90s flash photography with vintage aesthetic',
    thumbnail: NINETIES_PHOTO_1,
    thumbnails: [NINETIES_PHOTO_1],
    prompt: `Without changing her original face, create a portrait of a beautiful young woman with porcelain-white skin, captured with a 1990s-style camera using a direct front flash. Her messy dark brown hair is tied up, posing with a calm yet playful smile. She wears a modern oversized cream sweater. The background is a dark white wall covered with aesthetic magazine posters and stickers, evoking a cozy bedroom or personal room atmosphere under dim lighting. The 35mm lens flash creates a nostalgic glow.`
  },
  professional_headshot: {
    key: 'professional_headshot',
    name: 'Professional Headshot',
    description: 'High-resolution studio headshot with perfect lighting and clarity',
    thumbnail: PROFESSIONAL_HEADSHOT_1,
    thumbnails: [PROFESSIONAL_HEADSHOT_1],
    prompt: `A professional, high-resolution profile photo, maintaining the exact facial structure, identity, and key features of the person in the input image. The subject is framed from the chest up, with ample headroom. The person looks directly at the camera. They are styled for a professional photo studio shoot, wearing a premium smart casual blazer in a subtle charcoal gray. The background is a solid '#562226' neutral studio color. Shot from a high angle with bright and airy soft, diffused studio lighting, gently illuminating the face and creating a subtle catchlight in the eyes, conveying a sense of clarity. Captured on an 85mm f/1.8 lens with a shallow depth of field, exquisite focus on the eyes, and beautiful, soft bokeh. Observe crisp detail on the fabric texture of the blazer, individual strands of hair, and natural, realistic skin texture. The atmosphere exudes confidence, professionalism, and approachability. Clean and bright cinematic color grading with subtle warmth and balanced tones, ensuring a polished and contemporary feel.`
  },
  with_puppy: {
    key: 'with_puppy',
    name: 'With Puppy',
    description: 'Adorable winter outdoor moment holding a cute puppy',
    thumbnail: PUPPY_PHOTO_1,
    thumbnails: [PUPPY_PHOTO_1],
    prompt: `The person's facial features, expression, and identity must remain exactly the same as the reference image. Preserve the original face completely. The person is outdoors in a winter scene, puckering their lips toward the camera in a playful, cute expression. They are wearing a black hooded sweatshirt and holding a small white puppy with light blue eyes. The puppy has a calm expression, looking forward. Environment: outdoors in a winter scene with snow covering the ground, bare trees in the background, and a blurred silver car behind the person. The sky is a clear light blue. Mood: cute, natural, winter outdoor moment. Camera style: soft depth of field, natural daylight, subtle winter tones. The composition captures a heartwarming moment between the person and the adorable puppy.`
  },
  pikachu: {
    key: 'pikachu',
    name: 'With Pikachu',
    description: 'Energetic portrait with giant 3D Pikachu character',
    thumbnail: PIKACHU_PHOTO_1,
    thumbnails: [PIKACHU_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, professional fashion photoshoot. The person is wearing an electric yellow knitted sweater, black high-waisted jeans, and white high-top sneakers with black accents. The person is standing casually with their arm resting on a giant 3D photorealistic Pikachu character beside them. Pikachu should be rendered in ultra-realistic 3D with accurate proportions, textures, and the iconic red cheeks, smiling up at the person with a cheerful expression. The person has an energetic, cheerful expression. Environment: vibrant yellow backdrop with professional studio lighting. The lighting creates soft shadows and highlights the texture of the knitted sweater. Camera: Shot on a high-end fashion camera with shallow depth of field. The composition captures a fun, playful interaction between the person and the beloved Pokémon character in a modern, stylish photoshoot aesthetic.`
  },
  tom_and_jerry: {
    key: 'tom_and_jerry',
    name: 'With Tom & Jerry',
    description: 'Fun portrait with iconic Tom & Jerry duo in 3D',
    thumbnail: TOM_AND_JERRY_PHOTO_1,
    thumbnails: [TOM_AND_JERRY_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, professional fashion photoshoot. The person is wearing a light grey knitted sweater, blue high-waisted jeans, and white high-top sneakers. The person is standing with their arm around a giant 3D photorealistic Tom Cat character. Tom should be rendered in ultra-realistic 3D while maintaining his iconic cartoon appearance - grey and white fur, posing confidently with a mischievous smirk. On Tom's shoulder sits Jerry Mouse, also in 3D photorealistic style with his characteristic brown fur and playful expression. The person has a fun, mischievous expression. Environment: clean grey-blue backdrop with professional studio lighting. Camera: Shot on a high-end fashion camera with perfect focus on all three subjects. The composition captures the playful dynamic between the person and the classic cartoon duo in a modern photoshoot style.`
  },
  ben_ten: {
    key: 'ben_ten',
    name: 'With Ben 10',
    description: 'Dynamic hero-style portrait with Ben 10 and glowing Omnitrix',
    thumbnail: BEN_TEN_PHOTO_1,
    thumbnails: [BEN_TEN_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, professional fashion photoshoot with sci-fi hero aesthetics. The person is wearing a Ben 10 themed green and black sweater, dark grey jeans, and white sneakers with green accents. The person is standing confidently beside a giant 3D photorealistic render of Ben Tennyson (Classic Ben 10 character) who is activating his Omnitrix. Ben should be rendered in ultra-realistic 3D with cartoon accuracy - wearing his iconic green jacket with the number 10, black shirt, cargo pants, and the glowing green Omnitrix device on his wrist. The Omnitrix emits a dynamic bright green glow. The person has a confident, energetic expression. Environment: neon-green and black circuitry patterns backdrop, with dynamic green glow reflecting from the Omnitrix onto both subjects. The lighting creates a sci-fi hero fashion shoot mood. Camera: Shot on a high-end fashion camera with professional lighting that emphasizes the dramatic green glow. The composition captures an action-ready, superhero-inspired moment.`
  },
  pink_panther: {
    key: 'pink_panther',
    name: 'With Pink Panther',
    description: 'Elegant and stylish portrait with the suave Pink Panther',
    thumbnail: PINK_PANTHER_PHOTO_1,
    thumbnails: [PINK_PANTHER_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, professional fashion photoshoot. The person is wearing a pastel pink knitted sweater, white high-waisted jeans, and white sneakers with pink accents. The person is posing fashionably beside a tall giant 3D photorealistic Pink Panther character. The Pink Panther should be rendered in ultra-realistic 3D with accurate iconic features - bright pink fur, elongated body, distinctive snout, and characteristic cool, suave posture striking a stylish pose with one paw raised. The person has an elegant, stylish expression. Environment: light pastel pink backdrop with soft, flattering professional studio lighting. The lighting creates a dreamy, fashionable atmosphere. Camera: Shot on a high-end fashion camera with shallow depth of field and perfect focus. The composition captures a sophisticated, fashion-forward moment with the legendary cool character in a modern editorial style.`
  }
};

export const STYLE_LIST = Object.values(STYLE_PRESETS);
