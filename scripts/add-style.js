#!/usr/bin/env node

/**
 * Automated Style Addition Script
 * 
 * Usage: node scripts/add-style.js
 * 
 * This script will:
 * 1. Prompt for category and style name
 * 2. Generate an AI prompt for the style
 * 3. Create a preview image using Replicate API
 * 4. Show preview for approval
 * 5. Add style to all necessary files
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Available categories
const CATEGORIES = {
  professional: { id: 'professional', name: 'Professional', icon: '💼' },
  lifestyle: { id: 'lifestyle', name: 'Social & Lifestyle', icon: '✨' },
  creative: { id: 'creative', name: 'Creative', icon: '🎭' },
  fashion: { id: 'fashion', name: 'Fashion', icon: '👗' },
  seasonal: { id: 'seasonal', name: 'Seasonal', icon: '🎄' }
};

// Replicate API configuration
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || 'r8_6zHXGXWFBwjqVUBVy7aMkVnEUTfvNxh3Xf0Wy';
const NANO_BANANA_MODEL = 'nanoai/nano-banana:c7e9b2f6c0b8f3e8d5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2';

/**
 * Generate AI prompt for a style
 */
function generatePrompt(styleName, category) {
  const basePrompt = `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face.`;
  
  // Style-specific prompt generation
  const stylePrompts = {
    'with supercar': `${basePrompt}

Create a hyper-realistic, luxury lifestyle photoshoot. 

SUBJECT: The person is standing confidently next to a sleek Lamborghini Aventador SVJ in Arancio Argos (vibrant orange). They are wearing a tailored charcoal gray suit with a crisp white dress shirt (no tie), paired with luxury black leather loafers. A premium Swiss watch is visible on their wrist.

POSE: Standing at a 3/4 angle to the camera, one hand casually resting on the car's roof, the other in their pocket. Confident, relaxed posture with a subtle smile.

EXPRESSION: Successful, confident, approachable. Natural smile, eyes focused on camera.

CAR DETAILS: Lamborghini Aventador SVJ, glossy orange paint with carbon fiber accents, aggressive aerodynamic design, scissor doors closed, positioned at a dynamic angle showing both the front and side profile.

ENVIRONMENT: Modern luxury setting - either a contemporary architectural space with glass and concrete, or a scenic coastal road at golden hour. Clean, minimal background that doesn't distract from the subject and car.

LIGHTING: Golden hour lighting (warm, soft sunlight), creating beautiful highlights on the car's curves and the person's face. Subtle rim lighting separating subject from background. Professional color grading with rich, warm tones.

CAMERA: Shot with a Canon EOS R5, 35mm f/1.4 lens, shallow depth of field (f/2.8) keeping both the person and car in focus while softly blurring the background. Eye-level perspective. Professional automotive photography style.

QUALITY: 8K resolution, ultra-sharp details, professional color grading, cinematic look, magazine-quality commercial photography.`,
  };
  
  return stylePrompts[styleName.toLowerCase()] || `${basePrompt}\n\nCreate a ${styleName} style portrait with professional photography quality.`;
}

/**
 * Generate preview image using Replicate API
 */
async function generatePreviewImage(prompt) {
  console.log('\n🎨 Generating preview image...');
  
  // For preview, use a stock photo URL as reference
  const previewReferenceImage = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'; // Professional male portrait
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      version: 'c7e9b2f6c0b8f3e8d5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2',
      input: {
        prompt: prompt,
        image: previewReferenceImage,
        num_outputs: 1,
        guidance_scale: 7.5,
        num_inference_steps: 50
      }
    });

    const options = {
      hostname: 'api.replicate.com',
      port: 443,
      path: '/v1/predictions',
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.id) {
            // Poll for result
            pollPrediction(response.id, resolve, reject);
          } else {
            reject(new Error('Failed to create prediction'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Poll Replicate API for prediction result
 */
function pollPrediction(predictionId, resolve, reject, attempts = 0) {
  if (attempts > 60) {
    reject(new Error('Timeout waiting for image generation'));
    return;
  }

  setTimeout(() => {
    const options = {
      hostname: 'api.replicate.com',
      port: 443,
      path: `/v1/predictions/${predictionId}`,
      method: 'GET',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.status === 'succeeded') {
            resolve(response.output[0]); // Image URL
          } else if (response.status === 'failed') {
            reject(new Error('Image generation failed'));
          } else {
            // Still processing
            process.stdout.write('.');
            pollPrediction(predictionId, resolve, reject, attempts + 1);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  }, 2000); // Poll every 2 seconds
}

/**
 * Download image from URL
 */
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

/**
 * Convert style name to key
 */
function styleNameToKey(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

/**
 * Convert style name to constant name
 */
function styleNameToConstant(name) {
  return name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '') + '_PHOTO_1';
}

/**
 * Add style to frontend constants
 */
function addToFrontendConstants(styleKey, styleName, description, prompt, constantName, assetPath) {
  const filePath = path.join(__dirname, '../mobile/src/constants/styles.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import
  const importLine = `const ${constantName} = require('${assetPath}');`;
  const lastImportIndex = content.lastIndexOf('const ') + content.substring(content.lastIndexOf('const ')).indexOf(';') + 1;
  content = content.slice(0, lastImportIndex) + '\n' + importLine + content.slice(lastImportIndex);
  
  // Add style definition
  const styleDefinition = `
  ${styleKey}: {
    key: '${styleKey}',
    name: '${styleName}',
    description: '${description}',
    thumbnail: ${constantName},
    thumbnails: [${constantName}],
    prompt: \`${prompt}\`,
  },`;
  
  const presetEndIndex = content.lastIndexOf('};');
  content = content.slice(0, presetEndIndex) + styleDefinition + '\n' + content.slice(presetEndIndex);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Updated frontend constants');
}

/**
 * Add style to backend service
 */
function addToBackendService(styleKey, prompt) {
  const filePath = path.join(__dirname, '../backend/src/services/nanoBanana.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  const styleDefinition = `  ${styleKey}: \`${prompt}\`,\n`;
  
  const promptsEndIndex = content.indexOf('};', content.indexOf('export const STYLE_PROMPTS'));
  content = content.slice(0, promptsEndIndex) + styleDefinition + content.slice(promptsEndIndex);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Updated backend service');
}

/**
 * Add style to category
 */
function addToCategory(categoryId, styleKey) {
  const files = [
    path.join(__dirname, '../mobile/app/style-select.tsx'),
    path.join(__dirname, '../mobile/src/screens/StyleSelectScreen.tsx')
  ];
  
  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find the category and add style to its styles array
    const categoryRegex = new RegExp(`(id:\\s*'${categoryId}'[^}]*styles:\\s*\\[)([^\\]]*)(\\])`, 's');
    const match = content.match(categoryRegex);
    
    if (match) {
      const existingStyles = match[2];
      const newStyles = existingStyles.trim() ? `${existingStyles.trim()}, '${styleKey}'` : `'${styleKey}'`;
      content = content.replace(categoryRegex, `$1${newStyles}$3`);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
  
  console.log('✅ Updated category files');
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Automated Style Addition Tool\n');
  
  // Show available categories
  console.log('Available categories:');
  Object.values(CATEGORIES).forEach(cat => {
    console.log(`  ${cat.icon} ${cat.id} - ${cat.name}`);
  });
  console.log('');
  
  // Get input
  const categoryId = await question('Enter category ID: ');
  const styleName = await question('Enter style name (e.g., "With Supercar"): ');
  const description = await question('Enter brief description: ');
  
  if (!CATEGORIES[categoryId]) {
    console.error('❌ Invalid category ID');
    rl.close();
    return;
  }
  
  const styleKey = styleNameToKey(styleName);
  const constantName = styleNameToConstant(styleName);
  
  console.log(`\n📝 Style Key: ${styleKey}`);
  console.log(`📝 Constant Name: ${constantName}`);
  
  // Generate prompt
  console.log('\n🤖 Generating AI prompt...');
  const prompt = generatePrompt(styleName, categoryId);
  console.log('\n📋 Generated Prompt:');
  console.log('─'.repeat(80));
  console.log(prompt);
  console.log('─'.repeat(80));
  
  const confirmPrompt = await question('\n✅ Approve this prompt? (yes/no): ');
  if (confirmPrompt.toLowerCase() !== 'yes' && confirmPrompt.toLowerCase() !== 'y') {
    console.log('❌ Cancelled');
    rl.close();
    return;
  }
  
  // Generate preview image
  try {
    const imageUrl = await generatePreviewImage(prompt);
    console.log('\n\n✅ Preview image generated!');
    console.log(`🔗 Preview URL: ${imageUrl}`);
    
    const confirmImage = await question('\n✅ Approve this image? (yes/no): ');
    if (confirmImage.toLowerCase() !== 'yes' && confirmImage.toLowerCase() !== 'y') {
      console.log('❌ Cancelled');
      rl.close();
      return;
    }
    
    // Create asset folder
    const assetFolder = path.join(__dirname, '../mobile/assets', styleName.replace(/\s+/g, ''));
    if (!fs.existsSync(assetFolder)) {
      fs.mkdirSync(assetFolder, { recursive: true });
    }
    
    // Download image
    const imagePath = path.join(assetFolder, 'preview.jpg');
    console.log('\n📥 Downloading image...');
    await downloadImage(imageUrl, imagePath);
    console.log('✅ Image saved');
    
    // Update files
    const assetPath = `../../assets/${styleName.replace(/\s+/g, '')}/preview.jpg`;
    addToFrontendConstants(styleKey, styleName, description, prompt, constantName, assetPath);
    addToBackendService(styleKey, prompt);
    addToCategory(categoryId, styleKey);
    
    console.log('\n🎉 Style added successfully!');
    console.log(`\n📱 Style "${styleName}" has been added to the "${CATEGORIES[categoryId].name}" category`);
    console.log('\n⚠️  Remember to:');
    console.log('  1. Rebuild the app: npx expo run:android');
    console.log('  2. Test the style generation');
    console.log('  3. Deploy backend if needed');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
  
  rl.close();
}

main();
