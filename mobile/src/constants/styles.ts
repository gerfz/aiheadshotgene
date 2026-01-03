import { StylePreset } from '../types';

// Business photos
const BUSINESS_PHOTO_1 = require('../../assets/business/518559229-793ad242-7867-4709-bdc6-55021f5eb78f.png');
const TIGHT_PORTRAIT_PHOTO_1 = require('../../assets/business/tightportraitfromuppertorso.jpg');
const LUXURY_FASHION_PHOTO_1 = require('../../assets/business/luxuryfashion.jpg');

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

// Pokémon Character photos
const BULBASAUR_PHOTO_1 = require('../../assets/pokemons/bulbasaur.png');
const CHARMANDER_PHOTO_1 = require('../../assets/pokemons/Charmander.png');
const SQUIRTLE_PHOTO_1 = require('../../assets/pokemons/Squirtle.png');
const JIGGLYPUFF_PHOTO_1 = require('../../assets/pokemons/Jigglypuff.png');

// Zootopia Character photos
const ZOOTOPIA_CABLE_CAR_PHOTO_1 = require('../../assets/slyfoxdumbbunny/example.jpg');

// Creative photos
const MAGAZINE_COVER_PHOTO_1 = require('../../assets/creative/magazincover.jpg');

// Jobs photos (using placeholders - will need actual images)
const CHEF_PHOTO_1 = { uri: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=1000&auto=format&fit=crop' };
const PILOT_PHOTO_1 = { uri: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?q=80&w=1000&auto=format&fit=crop' };
const DOCTOR_PHOTO_1 = { uri: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=1000&auto=format&fit=crop' };
const ARTIST_PHOTO_1 = { uri: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1000&auto=format&fit=crop' };
const FIREFIGHTER_PHOTO_1 = { uri: 'https://images.unsplash.com/photo-1541450805988-c9c1c8e1f0c7?q=80&w=1000&auto=format&fit=crop' };

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
  tight_portrait: {
    key: 'tight_portrait',
    name: 'Cinematic Portrait',
    description: 'Dramatic tight portrait with cinematic lighting and editorial style',
    thumbnail: TIGHT_PORTRAIT_PHOTO_1,
    thumbnails: [TIGHT_PORTRAIT_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a tight portrait crop from upper torso to head in vertical orientation. Composition: Subject placed slightly right of center with shoulders angled and head turned toward camera at eye-level. Shallow depth of field with smooth background falloff. Soft negative space on left side created by gradient background. Subject: Three-quarter profile with subtle head tilt. Serious, confident, introspective expression with gaze directed slightly past the camera. Sharp jawline, defined cheekbones, light stubble. Short, dark, neatly styled hair with slight texture. High-detail skin with visible pores and natural highlights. Wardrobe: Black or very dark charcoal knit zip-up sweater with heavy ribbed knit fabric texture. Slim fit with high collar partially zipped. Minimalist, modern, masculine style. Lighting: Strong directional light from front-left with minimal fill allowing deep shadows. Subtle rim light for edge separation along jaw and shoulder. High contrast with dramatic shadow sculpting. Soft but directional, cinematic light quality with controlled specular highlights on skin. Color Palette: Deep red, burgundy, and black dominant colors. Warm, slightly desaturated skin tones. Moody and cinematic overall tone with warm shadows and subtle red cast color grading. Background: Dark red gradient studio backdrop with smooth texture and soft light diffusion. Clear subject-background separation via lighting and contrast. Technical: Short telephoto portrait lens look (85mm equivalent). Wide aperture style (f/1.8–f/2.8). High facial sharpness with smooth background blur. Minimal noise, clean studio image with controlled highlights and rich shadows. Artistic Style: Fashion portrait / cinematic editorial genre. Intense, refined, dramatic mood. Luxury, high-fashion, modern masculinity aesthetic with cinematic lighting influences. Post-Processing: Subtle skin retouching preserving texture. Enhanced midtone contrast. Warm red-toned grade with muted saturation. Very subtle edge darkening vignette.`
  },
  luxury_fashion: {
    key: 'luxury_fashion',
    name: 'Luxury Fashion Editorial',
    description: 'Dark cinematic mafia romance aesthetic with luxury fashion lighting',
    thumbnail: LUXURY_FASHION_PHOTO_1,
    thumbnails: [LUXURY_FASHION_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Design a dark, cinematic portrait featuring a powerful, refined alpha male with luxury fashion editorial lighting and a moody, romantic tone. Subject: Handsome alpha male with dominant, controlled, mysterious presence. Facial features: Smoldering, intense, restrained expression. Gaze looking downward, partially obscured by shadow. Clean, smooth skin with no tattoos. High-detail facial structure. Pose: Adjusting the cufflink on one sleeve of white dress shirt. Body language: Confident, composed, quietly powerful. Wardrobe: Sharp tailored black suit, crisp white dress shirt, dark tie. Luxury, classic, high-status mafia aesthetic. Scene and Background: Pure black background. Minimalist studio setup. Dark, moody, seductive, elite atmosphere. Lighting: Cinematic soft directional lighting angled to sculpt the face and suit. Very subtle fill to preserve shadow depth. Face partially in shadow with smooth tonal transitions. Continuous tonal gradients across the face. Intense, luxurious, emotionally charged mood. Composition: Medium portrait framing from torso to head. Centered composition with strong vertical symmetry. Subject perfectly centered in frame. Ample dark space around subject. Photography Style: Luxury fashion editorial / cinematic portrait. Dark mafia romance aesthetic. High-end studio photography. Color and Grading: Deep blacks, charcoal shadows, soft neutral skin tones, clean white highlights. Low-key cinematic grading with controlled highlights and deep blacks. Detail: High-detail suit texture and fabric folds. Photorealistic, film-quality realism. Polished, premium quality finish.`
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
  },
  bulbasaur: {
    key: 'bulbasaur',
    name: 'With Bulbasaur',
    description: 'Playful mint-green themed portrait with adorable Bulbasaur',
    thumbnail: BULBASAUR_PHOTO_1,
    thumbnails: [BULBASAUR_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, premium studio fashion shoot with designer-toy finish. The person is wearing a mint-green knitted sweater, off-white high-waisted jeans, and white high-top sneakers with subtle green accents. The person is standing with one hand naturally resting near the bud area on a giant 3D photorealistic Bulbasaur (not covering faces), the other hand lightly on the waist. The person has a playful, lively, mischievous smile. Bulbasaur should be rendered as a giant 3D photorealistic character with a cute yet realistic, premium vinyl-toy look - clean skin micro-texture, refined bud material detail, clear glossy eyes, and crisp silhouette. Bulbasaur tilts its head up slightly toward the person with a gentle, friendly photo-op vibe. Environment: clean mint gradient studio backdrop, minimal. Lighting: soft key light plus subtle rim light, porcelain-fair clean skin rendering, crisp shadows. Composition: full-body or 3/4 fashion-ad framing with generous negative space, premium street-editorial vibe.`
  },
  charmander: {
    key: 'charmander',
    name: 'With Charmander',
    description: 'Energetic orange-red portrait with confident Charmander',
    thumbnail: CHARMANDER_PHOTO_1,
    thumbnails: [CHARMANDER_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, premium studio fashion shoot with designer-toy finish. The person is wearing a vibrant orange-red knitted sweater, deep black high-waisted jeans, and white high-top sneakers with subtle orange accents. The person is standing with their arm casually leaning on a giant 3D photorealistic Charmander's shoulder or back area, body slightly angled for a stronger silhouette. The person has an energetic, confident, cheeky smile. Charmander should be rendered as a giant 3D photorealistic character with controlled warm glow accents - refined skin detail, tail flame realistic but not overpowering, clear glossy eyes. Charmander wears a proud expression, and the tail flame adds a subtle warm rim-light reflection on the person. Environment: high-saturation orange-red gradient backdrop, minimal fashion studio. Lighting: studio key light plus subtle warm rim from tail flame, clean premium finish. Composition: 3/4 body framing with bold color-block impact, commercial fashion vibe.`
  },
  squirtle: {
    key: 'squirtle',
    name: 'With Squirtle',
    description: 'Fresh sea-blue portrait with cool Squirtle companion',
    thumbnail: SQUIRTLE_PHOTO_1,
    thumbnails: [SQUIRTLE_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, premium studio fashion shoot with designer-toy finish. The person is wearing a sea-salt blue knitted sweater, light grey high-waisted jeans, and white high-top sneakers with subtle blue accents. The person is standing with one hand lightly resting on the edge of a giant 3D photorealistic Squirtle's shell, the other hand relaxed. The person has a fresh, cute, slightly cool expression. Squirtle should be rendered as a giant 3D photorealistic character with a glossy-toy yet realistic finish - premium semi-gloss shell material, clean skin micro-detail, clear glossy eyes. Squirtle holds a relaxed signature smile pose, creating a crisp monochrome duo aesthetic. Environment: clean light-blue gradient studio backdrop, minimal. Lighting: soft key light plus delicate rim, porcelain-fair clean skin rendering. Composition: full-body or 3/4 framing with airy negative space, refined clean look.`
  },
  jigglypuff: {
    key: 'jigglypuff',
    name: 'With Jigglypuff',
    description: 'Soft pastel portrait with sweet Jigglypuff charm',
    thumbnail: JIGGLYPUFF_PHOTO_1,
    thumbnails: [JIGGLYPUFF_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a hyper-realistic, soft pastel editorial, premium studio fashion shoot. The person is wearing a pastel lavender-pink knitted sweater, creamy off-white high-waisted jeans, and white/pink high-top sneakers. The person is in a stylish standing pose, gently leaning beside a giant 3D photorealistic Jigglypuff. Jigglypuff does a cute photo gesture with a small wave or hands-on-cheeks. The person has a soft, sweet, elegant expression. Jigglypuff should be rendered as a giant 3D photorealistic character with a premium plush-toy vibe - subtle fuzzy surface, clean noise-free finish, clear glossy eyes, high-end designer-toy look. Jigglypuff smiles and waves slightly, creating a cute-yet-premium duo mood. Environment: light pastel lavender-pink gradient backdrop with extremely subtle paper-like texture. Lighting: diffused soft light, clean translucent skin rendering, airy mood. Composition: magazine-cover style framing with generous negative space, refined sweetness.`
  },
  zootopia_cable_car: {
    key: 'zootopia_cable_car',
    name: 'Zootopia Cable Car',
    description: 'Cozy Swiss Alps cable car scene with Nick Wilde and Judy Hopps',
    thumbnail: ZOOTOPIA_CABLE_CAR_PHOTO_1,
    thumbnails: [ZOOTOPIA_CABLE_CAR_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a cozy, cinematic winter scene inside a glass cable car in the Swiss Alps. The person is wearing a red knit sweater and blue jeans, sitting on a wooden bench, smiling softly at the camera with long dark hair and a warm, natural look. On the person's left, Nick Wilde from Zootopia, the sly red fox character, leans in relaxed wearing his green shirt and striped tie with a confident smirk. On the person's right, Judy Hopps from Zootopia, the cheerful gray rabbit police officer in her blue uniform, sits close with an energetic, friendly expression. The person has their arms around both characters, creating a wholesome, affectionate moment. Nick Wilde and Judy Hopps should be rendered as high-quality photorealistic 3D animated characters that blend seamlessly with the real person. Outside the cable car window, snow-covered mountains stretch into the distance under a clear blue sky, with a red alpine train crossing a stone bridge in the background. Environment: bright natural daylight, crisp winter atmosphere, ultra-detailed glass cable car interior with wooden benches. Lighting: soft natural light from windows, gentle shadows. Composition: cozy travel aesthetic with sharp focus, 4:5 aspect ratio, high resolution. The scene should feel warm and wholesome despite the cold winter setting outside.`
  },
  magazine_cover: {
    key: 'magazine_cover',
    name: 'Magazine Cover',
    description: 'High-fashion magazine cover editorial with vintage car and spring vibes',
    thumbnail: MAGAZINE_COVER_PHOTO_1,
    thumbnails: [MAGAZINE_COVER_PHOTO_1],
    badge: {
      label: 'Female Only',
      type: 'female',
    },
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a high-fashion magazine cover shot of a stunning woman sitting on the hood of a vintage car. Subject Details: Woman in her 20s with platinum blonde hair styled in a sleek low side ponytail with deep side part and smooth texture. Expression: Piercing direct eye contact with confident, enigmatic, intense energy. Eyes looking straight at camera. Mouth slightly parted and relaxed. Overall sophisticated, bold, effortlessly chic expression. Face: Natural glam makeup with sculpted cheekbones, subtle eyeliner, matte nude lip. High-resolution realistic skin pores and texture. Fair pale skin tone with sun-kissed bright highlights. Pose: Sitting on a vintage car hood with legs crossed, one foot resting on car, one leg bent underneath. Hand resting elegantly on chin/jawline, leaning slightly forward with commanding presence. Slender high-fashion model physique with visible collarbones. Clothing: Oversized blazer over a black bralette. Heather grey blazer with black abstract/floral appliqué patches, textured wool blend, structured shoulders, open front - tailored yet relaxed. No pants visible (bare legs focus). Smooth skin texture on legs. Black strappy high heels with glossy finish and ankle straps. Setting: Outdoor driveway or garden. Vintage gold or metallic bronze car hood with shiny finish, classic muscle car aesthetic. Background: Blurred green trees, bright sky hints, natural greens. Luxurious sunny spring day atmosphere with dappled sunlight in background. Photography: High-end editorial fashion photography, magazine cover style. Eye-level or slightly low angle. Full body medium shot, center weighted. Sharp focus on subject with glossy magazine print quality. Bright natural sunlight with hard daylight, strong contrast, and distinct shadows. Shallow depth of field with bokeh background. 4:5 aspect ratio. Vibe: Magnetic and empowering energy. Sophisticated, cool, expensive mood. Classic editorial celebrity portraiture aesthetic. Polished professional shoot. A star at the height of her power, basking in the spring sun, redefining modern elegance.`
  },
  executive_chef: {
    key: 'executive_chef',
    name: 'Executive Chef',
    description: 'Michelin-star chef in modern kitchen with dramatic culinary artistry',
    thumbnail: CHEF_PHOTO_1,
    thumbnails: [CHEF_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a cinematic portrait of an executive chef in a high-end modern kitchen. The person wears a pristine white chef's coat with sharp creases and professional tailoring, black apron tied at the waist. Arms crossed confidently or hands clasped in front, holding a chef's knife with authority. Expression: Focused, passionate, confident with a slight knowing smile. Eyes show intensity and mastery of craft. Setting: Modern professional kitchen with stainless steel surfaces, soft bokeh of kitchen equipment in background. Warm ambient lighting from overhead pendant lights mixed with cool stainless steel reflections. Dramatic side lighting creates depth and highlights the chef's coat texture. Composition: Medium portrait from waist up, slightly off-center with kitchen elements visible. Steam rising subtly in the background adds atmosphere. Color palette: Clean whites, warm golds, stainless steel silvers, with pops of fresh ingredient colors softly blurred in background. Photography style: Editorial culinary magazine cover aesthetic. Shot on 50mm lens with shallow depth of field. Professional food photography lighting - soft but dramatic. High-detail fabric texture on chef's coat. Mood: Sophisticated, passionate, masterful. The portrait of a culinary artist at the peak of their craft.`
  },
  airline_pilot: {
    key: 'airline_pilot',
    name: 'Airline Pilot',
    description: 'Commercial airline captain in cockpit with golden hour aviation glory',
    thumbnail: PILOT_PHOTO_1,
    thumbnails: [PILOT_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a powerful portrait of a commercial airline pilot in the cockpit during golden hour. The person wears a sharp navy blue pilot uniform with gold epaulettes showing captain's stripes, crisp white shirt, black tie, and pilot's cap with gold emblem. Aviator sunglasses rest on the instrument panel or worn stylishly. Expression: Calm, confident, authoritative with a subtle professional smile. Eyes convey trust and competence. Pose: Seated in captain's seat, one hand on the control yoke, body turned slightly toward camera. Professional yet approachable posture. Setting: Modern aircraft cockpit with illuminated instruments and displays creating ambient blue and orange glows. Large cockpit windows show golden hour sky with dramatic clouds and sunset colors. Lighting: Warm golden hour sunlight streaming through cockpit windows, creating rim lighting on the uniform. Instrument panel lights add cool blue accent lighting to face. Cinematic aviation photography aesthetic. Composition: Medium portrait showing upper body and partial cockpit environment. Shallow depth of field with sharp focus on pilot, softly blurred instrument panels. Color palette: Navy blue uniform, gold accents, warm sunset oranges and pinks, cool instrument blues. Photography style: High-end aviation editorial. Shot on 35mm lens. Professional dramatic lighting. Mood: Inspiring, adventurous, trustworthy. The embodiment of aviation excellence and the dream of flight.`
  },
  surgeon: {
    key: 'surgeon',
    name: 'Surgeon',
    description: 'Elite surgeon in operating room with dramatic medical intensity',
    thumbnail: DOCTOR_PHOTO_1,
    thumbnails: [DOCTOR_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a dramatic portrait of an elite surgeon in a modern operating room. The person wears surgical scrubs in deep teal or navy blue, surgical cap, with a stethoscope draped around neck. Surgical mask pulled down to chin or held in hand, revealing face. Expression: Focused, intelligent, compassionate with determined eyes. A look of both intensity and care. Slight confident expression showing mastery and dedication. Pose: Standing with arms crossed holding surgical gloves, or hands clasped in front in a thoughtful pose. Confident professional stance. Setting: Modern operating room with surgical lights creating dramatic overhead illumination. Blurred medical equipment and monitors in background showing vital signs displays. Sterile blue-green color tones from surgical environment. Lighting: Dramatic overhead surgical lights creating strong directional lighting from above. Cool blue-green ambient light from OR environment. Rim lighting separating subject from background. Cinematic medical drama aesthetic. Composition: Medium portrait from waist up, centered with OR environment visible. Sharp focus on surgeon with softly blurred medical equipment. Color palette: Deep teal scrubs, surgical blues and greens, stainless steel, with warm skin tones contrasting cool environment. Photography style: Medical drama editorial. Shot on 50mm lens with dramatic lighting. High-detail fabric texture on scrubs. Mood: Heroic, dedicated, life-saving. The portrait of a medical professional at the height of their calling.`
  },
  creative_artist: {
    key: 'creative_artist',
    name: 'Creative Artist',
    description: 'Contemporary artist in studio with paint-splattered creative chaos',
    thumbnail: ARTIST_PHOTO_1,
    thumbnails: [ARTIST_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a vibrant portrait of a contemporary artist in their creative studio. The person wears paint-splattered denim shirt or black turtleneck with rolled-up sleeves, casual jeans with artistic stains. Hands show traces of paint on fingers. Expression: Passionate, thoughtful, inspired with a creative spark in the eyes. Slight smile showing love for their craft. Authentic artistic energy. Pose: Standing with arms crossed holding a paintbrush, or sitting casually on a stool with paint palette in hand. Relaxed yet engaged posture. One hand touching chin in contemplative gesture. Setting: Artist's studio with large canvases visible in background, paint tubes and brushes scattered artistically. Colorful abstract paintings partially visible. Natural light streaming through large industrial windows. Exposed brick or white walls with paint splatters. Lighting: Soft natural window light creating beautiful side lighting. Warm golden hour glow mixed with cool studio shadows. Paint colors in background create vibrant bokeh. Artistic documentary photography aesthetic. Composition: Medium portrait showing upper body and studio environment. Shallow depth of field with colorful artistic chaos softly blurred behind. Color palette: Vibrant paint colors - reds, blues, yellows, greens creating artistic energy. Warm skin tones. Denim blues or black clothing contrasting colorful background. Photography style: Documentary art editorial. Shot on 35mm lens. Natural light with artistic flair. Mood: Inspired, free-spirited, passionate. The portrait of a creative soul in their element, surrounded by the beauty of artistic expression.`
  },
  firefighter_hero: {
    key: 'firefighter_hero',
    name: 'Firefighter Hero',
    description: 'Heroic firefighter with dramatic smoke and fire truck backdrop',
    thumbnail: FIREFIGHTER_PHOTO_1,
    thumbnails: [FIREFIGHTER_PHOTO_1],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face. Create a powerful heroic portrait of a firefighter after a successful rescue. The person wears full firefighter turnout gear - heavy tan/beige protective coat with reflective yellow stripes, fire helmet with shield, but coat is partially open showing dark t-shirt underneath. Face shows slight soot marks adding authenticity. Helmet held under one arm or worn pushed back. Expression: Strong, brave, determined yet compassionate. Eyes show courage and dedication. Slight proud smile of someone who saves lives. Authentic hero energy. Pose: Standing confidently with arms crossed or one hand on hip, other holding helmet. Strong heroic stance. Shoulders back, commanding presence. Setting: Fire truck in background with red lights creating dramatic ambient glow. Subtle smoke or mist in air adding atmosphere. Fire station bay or outdoor scene with emergency vehicle. Golden hour or dramatic twilight lighting. Lighting: Dramatic side lighting with warm golden tones. Red emergency lights creating accent lighting and rim light. Slight haze in air catching light beams. Cinematic action movie aesthetic. Composition: Medium to full portrait showing firefighter gear and fire truck background. Shallow depth of field with fire truck and smoke softly blurred. Color palette: Tan firefighter gear, reflective yellow stripes, red fire truck, warm golden light, cool blue shadows. Photography style: Cinematic hero portrait. Shot on 35mm lens with dramatic lighting. High-detail gear texture. Mood: Heroic, brave, inspiring. The portrait of an everyday hero who runs toward danger to save lives. Powerful and emotionally moving.`
  }
};

export const STYLE_LIST = Object.values(STYLE_PRESETS);
