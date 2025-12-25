import { StylePreset } from '../types';

// Business photos
const BUSINESS_PHOTO_1 = require('../../assets/business/518559229-793ad242-7867-4709-bdc6-55021f5eb78f.png');
const BUSINESS_PHOTO_2 = require('../../assets/business/640.webp');

// Emotional Film photos
const FILM_PHOTO_1 = require('../../assets/emotionalfilm/518559958-243d1b11-9ef0-4d4f-b308-97d67b5d3bc3.png');
const FILM_PHOTO_2 = require('../../assets/emotionalfilm/640.webp');

// Victoria's Secret photos
const VS_PHOTO_1 = require('../../assets/victoriasecret/G6TSEqzWYAIvaf9.jpg');
const VS_PHOTO_2 = require('../../assets/victoriasecret/G6TSEscXQAAm3Lo.jpg');
const VS_PHOTO_3 = require('../../assets/victoriasecret/G6TSEuEWEAAaR7N.jpg');

// Face consistency prefix that will be added to all custom prompts
export const FACE_CONSISTENCY_PREFIX = `Keep the facial features of the person in the uploaded image exactly consistent. Maintain 100% accuracy of the face from the reference image. Important: do not change the face. `;

export const STYLE_PRESETS: Record<string, StylePreset> = {
  custom: {
    key: 'custom',
    name: 'Custom Style',
    description: 'Create your own unique portrait with a custom prompt',
    thumbnail: require('../../assets/icon.png'), // Using app icon as placeholder
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
    thumbnails: [BUSINESS_PHOTO_1, BUSINESS_PHOTO_2],
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Dress them in a professional navy blue business suit with a white shirt, similar to the reference image. Background: Place the subject against a clean, solid dark gray studio photography backdrop. The background should have a subtle gradient, slightly lighter behind the subject and darker towards the edges (vignette effect). There should be no other objects. Photography Style: Shot on a Sony A7III with an 85mm f/1.4 lens, creating a flattering portrait compression. Lighting: Use a classic three-point lighting setup. The main key light should create soft, defining shadows on the face. A subtle rim light should separate the subject's shoulders and hair from the dark background. Crucial Details: Render natural skin texture with visible pores, not an airbrushed look. Add natural catchlights to the eyes. The fabric of the suit should show a subtle wool texture. Final image should be an ultra-realistic, 8k professional headshot.`
  },
  emotional_film: {
    key: 'emotional_film',
    name: 'Emotional Film Photography',
    description: 'Cinematic film look with rich colors and emotional depth',
    thumbnail: FILM_PHOTO_1,
    thumbnails: [FILM_PHOTO_1, FILM_PHOTO_2],
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
  }
};

export const STYLE_LIST = Object.values(STYLE_PRESETS);
