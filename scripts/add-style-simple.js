#!/usr/bin/env node

/**
 * Simple Style Addition Script
 * Uses your existing backend API to generate preview images
 * 
 * Usage: node scripts/add-style-simple.js "lifestyle" "With Supercar" "Luxury portrait with Lamborghini"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Get command line arguments
const [categoryId, styleName, description] = process.argv.slice(2);

if (!categoryId || !styleName || !description) {
  console.error('Usage: node scripts/add-style-simple.js <category> <style-name> <description>');
  console.error('Example: node scripts/add-style-simple.js "lifestyle" "With Supercar" "Luxury portrait with Lamborghini"');
  process.exit(1);
}

const BACKEND_URL = 'https://ai-headshot-generator.onrender.com';

// Style prompt templates
const STYLE_PROMPTS = {
  'with_supercar': {
    prompt: `Keep the facial features of the person in the uploaded image exactly consistent. Preserve 100% accuracy of the face from the reference image. Important: do not change the face.

Create a hyper-realistic, luxury lifestyle photoshoot. 

SUBJECT: The person is standing confidently next to a sleek Lamborghini Aventador SVJ in Arancio Argos (vibrant orange). They are wearing a tailored charcoal gray suit with a crisp white dress shirt (no tie), paired with luxury black leather loafers. A premium Swiss watch is visible on their wrist.

POSE: Standing at a 3/4 angle to the camera, one hand casually resting on the car's roof, the other in their pocket. Confident, relaxed posture with a subtle smile.

EXPRESSION: Successful, confident, approachable. Natural smile, eyes focused on camera.

CAR DETAILS: Lamborghini Aventador SVJ, glossy orange paint with carbon fiber accents, aggressive aerodynamic design, scissor doors closed, positioned at a dynamic angle showing both the front and side profile.

ENVIRONMENT: Modern luxury setting - either a contemporary architectural space with glass and concrete, or a scenic coastal road at golden hour. Clean, minimal background that doesn't distract from the subject and car.

LIGHTING: Golden hour lighting (warm, soft sunlight), creating beautiful highlights on the car's curves and the person's face. Subtle rim lighting separating subject from background. Professional color grading with rich, warm tones.

CAMERA: Shot with a Canon EOS R5, 35mm f/1.4 lens, shallow depth of field (f/2.8) keeping both the person and car in focus while softly blurring the background. Eye-level perspective. Professional automotive photography style.

QUALITY: 8K resolution, ultra-sharp details, professional color grading, cinematic look, magazine-quality commercial photography.`,
    previewImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'
  }
};

function styleNameToKey(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function styleNameToConstant(name) {
  return name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '') + '_PHOTO_1';
}

function styleNameToFolder(name) {
  return name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
}

async function generatePreview(prompt, referenceImage) {
  console.log('🎨 Generating preview image via backend API...');
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      prompt: prompt,
      image: referenceImage,
      style: 'preview_generation'
    });

    const options = {
      hostname: 'ai-headshot-generator.onrender.com',
      port: 443,
      path: '/api/generate',
      method: 'POST',
      headers: {
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
          if (response.imageUrl) {
            resolve(response.imageUrl);
          } else {
            reject(new Error('No image URL in response'));
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

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    const protocol = url.startsWith('https') ? https : require('http');
    
    protocol.get(url, (response) => {
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

function addToFrontendConstants(styleKey, styleName, description, prompt, constantName, assetPath) {
  const filePath = path.join(__dirname, '../mobile/src/constants/styles.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import after last const declaration
  const importLine = `const ${constantName} = require('${assetPath}');`;
  const lines = content.split('\n');
  let lastConstIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('const ') && lines[i].includes('require(')) {
      lastConstIndex = i;
    }
  }
  
  if (lastConstIndex !== -1) {
    lines.splice(lastConstIndex + 1, 0, importLine);
    content = lines.join('\n');
  }
  
  // Add style definition before closing brace of STYLE_PRESETS
  const styleDefinition = `  ${styleKey}: {
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
  console.log('✅ Updated mobile/src/constants/styles.ts');
}

function addToBackendService(styleKey, prompt) {
  const filePath = path.join(__dirname, '../backend/src/services/nanoBanana.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  const styleDefinition = `  ${styleKey}: \`${prompt}\`,\n`;
  
  // Find STYLE_PROMPTS and add before closing brace
  const promptsMatch = content.match(/export const STYLE_PROMPTS[\s\S]*?{([\s\S]*?)};/);
  if (promptsMatch) {
    const insertIndex = content.indexOf('};', content.indexOf('export const STYLE_PROMPTS'));
    content = content.slice(0, insertIndex) + styleDefinition + content.slice(insertIndex);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Updated backend/src/services/nanoBanana.ts');
  }
}

function addToCategory(categoryId, styleKey) {
  const files = [
    path.join(__dirname, '../mobile/app/style-select.tsx'),
  ];
  
  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find the category and add style
    const categoryRegex = new RegExp(`(id:\\s*'${categoryId}'[^}]*styles:\\s*\\[)([^\\]]*)(\\])`, 's');
    const match = content.match(categoryRegex);
    
    if (match) {
      const existingStyles = match[2].trim();
      const stylesArray = existingStyles.split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
      
      if (!stylesArray.includes(styleKey)) {
        stylesArray.push(styleKey);
        const newStylesString = stylesArray.map(s => `'${s}'`).join(', ');
        content = content.replace(categoryRegex, `$1${newStylesString}$3`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated ${path.basename(filePath)}`);
      } else {
        console.log(`⚠️  Style already exists in ${path.basename(filePath)}`);
      }
    } else {
      console.log(`⚠️  Category '${categoryId}' not found in ${path.basename(filePath)}`);
    }
  });
}

async function main() {
  console.log('🎨 Adding new style...\n');
  console.log(`Category: ${categoryId}`);
  console.log(`Style Name: ${styleName}`);
  console.log(`Description: ${description}\n`);
  
  const styleKey = styleNameToKey(styleName);
  const constantName = styleNameToConstant(styleName);
  const folderName = styleNameToFolder(styleName);
  
  console.log(`Style Key: ${styleKey}`);
  console.log(`Constant: ${constantName}`);
  console.log(`Folder: ${folderName}\n`);
  
  // Get prompt template
  const styleConfig = STYLE_PROMPTS[styleKey];
  if (!styleConfig) {
    console.error(`❌ No prompt template found for "${styleName}"`);
    console.error('Please add a prompt template to STYLE_PROMPTS in this script.');
    process.exit(1);
  }
  
  const { prompt, previewImage } = styleConfig;
  
  console.log('📋 Prompt:');
  console.log('─'.repeat(80));
  console.log(prompt.substring(0, 200) + '...');
  console.log('─'.repeat(80));
  console.log('');
  
  // Generate preview
  try {
    const imageUrl = await generatePreview(prompt, previewImage);
    console.log(`\n✅ Preview generated: ${imageUrl}\n`);
    console.log('🔗 PREVIEW LINK:', imageUrl);
    console.log('\n⏸️  Please review the image above.');
    console.log('   Press Enter to continue and add this style, or Ctrl+C to cancel...\n');
    
    // Wait for user confirmation
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    // Create asset folder
    const assetFolder = path.join(__dirname, '../mobile/assets', folderName);
    if (!fs.existsSync(assetFolder)) {
      fs.mkdirSync(assetFolder, { recursive: true });
      console.log(`✅ Created folder: mobile/assets/${folderName}`);
    }
    
    // Download image
    const imagePath = path.join(assetFolder, 'preview.jpg');
    console.log('📥 Downloading image...');
    await downloadImage(imageUrl, imagePath);
    console.log(`✅ Saved: ${imagePath}`);
    
    // Update files
    const assetPath = `../../assets/${folderName}/preview.jpg`;
    addToFrontendConstants(styleKey, styleName, description, prompt, constantName, assetPath);
    addToBackendService(styleKey, prompt);
    addToCategory(categoryId, styleKey);
    
    console.log('\n🎉 Style added successfully!\n');
    console.log('📝 Next steps:');
    console.log('  1. Review the changes in your code editor');
    console.log('  2. Rebuild the app: cd mobile && npx expo run:android');
    console.log('  3. Test the new style');
    console.log('  4. Deploy backend if needed\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
