import Replicate from 'replicate';
import dotenv from 'dotenv';

dotenv.config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// The Nano Banana model on Replicate
const MODEL_ID = 'google/nano-banana';

// Style prompts for professional headshots
export const STYLE_PROMPTS: Record<string, string> = {
  // Business Photo style
  business: `Keep the facial features of the person in the uploaded image exactly consistent. Dress them in a professional navy blue business suit with a white shirt, similar to the reference image. Background: Place the subject against a clean, solid dark gray studio photography backdrop. The background should have a subtle gradient, slightly lighter behind the subject and darker towards the edges (vignette effect). There should be no other objects. Photography Style: Shot on a Sony A7III with an 85mm f/1.4 lens, creating a flattering portrait compression. Lighting: Use a classic three-point lighting setup. The main key light should create soft, defining shadows on the face. A subtle rim light should separate the subject's shoulders and hair from the dark background. Crucial Details: Render natural skin texture with visible pores, not an airbrushed look. Add natural catchlights to the eyes. The fabric of the suit should show a subtle wool texture. Final image should be an ultra-realistic, 8k professional headshot.`,

  // Emotional Film Photography style
  emotional_film: `Keep the facial features of the person in the uploaded image exactly consistent. Style: A cinematic, emotional portrait shot on Kodak Portra 400 film. Setting: An urban street coffee shop window at Golden Hour (sunset). Warm, nostalgic lighting hitting the side of the face. Atmosphere: Apply a subtle film grain and soft focus to create a dreamy, storytelling vibe. Action: The subject is looking slightly away from the camera, holding a coffee cup, with a relaxed, candid expression. Details: High quality, depth of field, bokeh background of city lights.`,

  // Victoria's Secret Photoshoot style
  victoria_secret: `Create a glamorous photoshoot in the style of Victoria's Secret. A young woman attached in the uploaded reference image (Keep the face of the person 100% accurate from the reference image) stands almost sideways, slightly bent forward, during the final preparation for the show. Makeup artists apply lipstick to her (only her hands are visible in the frame). She is wearing a corset decorated with beaded embroidery and crystals with a short fluffy skirt, as well as large feather wings. The image has a "backstage" effect. The background is a darkly lit room, probably under the podium. The main emphasis is on the girl's face and the details of her costume. Emphasize the expressiveness of the gaze and the luxurious look of the outfit. The photo is lit by a flash from the camera, which emphasizes the shine of the beads and crystals on the corset, as well as the girl's shiny skin. Victoria's Secret style: sensuality, luxury, glamour. Very detailed. Important: do not change the face.`,

  // Legacy styles (keep for backwards compatibility)
  corporate: `Keep the facial features of the person in the uploaded image exactly consistent. Dress them in a professional navy blue business suit with a white shirt, similar to a corporate executive. Background: Place the subject against a clean, solid dark gray studio photography backdrop. The background should have a subtle gradient, slightly lighter behind the subject and darker towards the edges (vignette effect). There should be no other objects. Photography Style: Shot on a Sony A7III with an 85mm f/1.4 lens, creating a flattering portrait compression. Lighting: Use a classic three-point lighting setup. The main key light should create soft, defining shadows on the face. A subtle rim light should separate the subject's shoulders and hair from the dark background. Crucial Details: Render natural skin texture with visible pores, not an airbrushed look. Add natural catchlights to the eyes. The fabric of the suit should show a subtle wool texture. Final image should be an ultra-realistic, 8k professional headshot.`,

  creative: `Keep the facial features of the person in the uploaded image exactly consistent. Dress them in smart casual attire - a well-fitted blazer over a quality solid-color t-shirt. Background: Modern minimalist office or creative studio environment with soft natural window light. Blurred background with subtle hints of contemporary furniture or plants. Photography Style: Shot on a Canon EOS R5 with a 50mm f/1.2 lens for a natural perspective. Lighting: Soft, diffused window lighting from one side, creating gentle shadows and a warm, approachable feel. Crucial Details: Natural, relaxed expression. Authentic skin texture with a healthy glow. Modern, editorial style portrait suitable for creative industry professionals. Colors should be warm and inviting. Final image should be high-quality editorial portrait.`,

  friendly: `Keep the facial features of the person in the uploaded image exactly consistent. Dress them in a light blue oxford shirt, no jacket - professional yet approachable. Background: Warm neutral background with a soft, seamless gradient. Cream to light tan tones. Photography Style: Shot on a Nikon Z8 with an 85mm f/1.8 lens for flattering compression. Lighting: Soft, diffused key light creating minimal shadows. Fill light for an even, welcoming look. A subtle warmth in the lighting temperature. Crucial Details: Genuine, warm smile showing approachability. Natural skin tones with warm undertones. Eyes should have clear catchlights and appear engaged. Professional yet friendly headshot perfect for LinkedIn or company profiles. Final image should be a professional, approachable headshot.`
};

export async function generatePortrait(
  imageBase64: string,
  styleKey: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const prompt = STYLE_PROMPTS[styleKey];
  
  if (!prompt) {
    throw new Error(`Unknown style: ${styleKey}`);
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
    console.error('Replicate generation error:', error);
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
