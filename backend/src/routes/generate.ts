import { Router, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, verifyGuestOrToken, AuthenticatedRequest } from '../middleware/auth';
import { generatePortrait, getAvailableStyles } from '../services/nanoBanana';
import {
  getUserProfile,
  decrementCredits,
  createGeneration,
  updateGeneration,
  uploadImage,
  getOrCreateGuestProfile,
  decrementGuestCredits,
  createGuestGeneration
} from '../services/supabase';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get available styles
router.get('/styles', (req, res) => {
  const styles = getAvailableStyles();
  res.json({ styles });
});

// Generate portrait (supports both authenticated users and guests)
router.post(
  '/',
  verifyGuestOrToken,
  upload.single('image'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { styleKey, customPrompt } = req.body;
      const file = req.file;
      const isGuest = req.isGuest;

      console.log('Generate request - styleKey:', styleKey, 'customPrompt:', customPrompt);

      if (!file) {
        return res.status(400).json({ error: 'No image uploaded' });
      }

      if (!styleKey) {
        return res.status(400).json({ error: 'Style key is required' });
      }

      // Validate custom style requires custom prompt
      if (styleKey === 'custom' && (!customPrompt || customPrompt.trim().length === 0)) {
        return res.status(400).json({ 
          error: 'Custom prompt is required',
          message: 'Please provide a description for your custom style'
        });
      }

      let hasCredits = false;
      let isSubscribed = false;
      let generation: any;
      let folderPath: string;

      if (isGuest) {
        // Guest user flow
        const deviceId = req.guestDeviceId!;
        const guestProfile = await getOrCreateGuestProfile(deviceId);
        
        if (guestProfile.free_credits <= 0) {
          return res.status(403).json({ 
            error: 'No credits remaining',
            message: 'Sign up for a free account to get more credits!',
            requiresSignup: true
          });
        }
        
        hasCredits = true;
        folderPath = `guests/${deviceId}`;
        
        // Upload original image
        const originalFileName = `${folderPath}/${uuidv4()}-original.${file.mimetype.split('/')[1]}`;
        const originalImageUrl = await uploadImage(
          'portraits',
          originalFileName,
          file.buffer,
          file.mimetype
        );
        
        // Create guest generation record
        generation = await createGuestGeneration(deviceId, styleKey, originalImageUrl, customPrompt);
        
      } else {
        // Authenticated user flow
        const userId = req.userId!;
        const profile = await getUserProfile(userId);
        
        if (!profile.is_subscribed && profile.free_credits <= 0) {
          return res.status(403).json({ 
            error: 'No credits remaining',
            message: 'Please subscribe to continue generating portraits'
          });
        }
        
        hasCredits = true;
        isSubscribed = profile.is_subscribed;
        folderPath = userId;
        
        // Upload original image
        const originalFileName = `${folderPath}/${uuidv4()}-original.${file.mimetype.split('/')[1]}`;
        const originalImageUrl = await uploadImage(
          'portraits',
          originalFileName,
          file.buffer,
          file.mimetype
        );
        
        // Create generation record
        generation = await createGeneration(userId, styleKey, originalImageUrl, customPrompt);
      }

      // Generate portrait using Nano Banana
      const imageBase64 = file.buffer.toString('base64');
      
      try {
        await updateGeneration(generation.id, { status: 'processing' });
        
        const generatedImageBase64 = await generatePortrait(
          imageBase64,
          styleKey,
          file.mimetype,
          customPrompt
        );

        // Upload generated image
        const generatedFileName = `${folderPath}/${uuidv4()}-generated.jpg`;
        const generatedBuffer = Buffer.from(generatedImageBase64, 'base64');
        const generatedImageUrl = await uploadImage(
          'portraits',
          generatedFileName,
          generatedBuffer,
          'image/jpeg'
        );

        // Update generation record
        await updateGeneration(generation.id, {
          status: 'completed',
          generated_image_url: generatedImageUrl
        });

        // Decrement credits
        if (isGuest) {
          await decrementGuestCredits(req.guestDeviceId!);
        } else if (!isSubscribed) {
          await decrementCredits(req.userId!);
        }

        res.json({
          success: true,
          generation: {
            id: generation.id,
            originalImageUrl: generation.original_image_url,
            generatedImageUrl,
            styleKey,
            status: 'completed'
          }
        });

      } catch (genError: any) {
        await updateGeneration(generation.id, { status: 'failed' });
        throw genError;
      }

    } catch (error: any) {
      console.error('Generation error:', error);
      res.status(500).json({ 
        error: 'Generation failed', 
        message: error.message 
      });
    }
  }
);

// Get generation status (supports both users and guests)
router.get(
  '/:id/status',
  verifyGuestOrToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const isGuest = req.isGuest;

      let query = require('../services/supabase').supabaseAdmin
        .from('generations')
        .select('*')
        .eq('id', id);

      if (isGuest) {
        query = query.eq('guest_device_id', req.guestDeviceId);
      } else {
        query = query.eq('user_id', req.userId);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        return res.status(404).json({ error: 'Generation not found' });
      }

      res.json({ generation: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete generation (supports both users and guests)
router.delete(
  '/:id',
  verifyGuestOrToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const isGuest = req.isGuest;

      let query = require('../services/supabase').supabaseAdmin
        .from('generations')
        .delete()
        .eq('id', id);

      if (isGuest) {
        query = query.eq('guest_device_id', req.guestDeviceId);
      } else {
        query = query.eq('user_id', req.userId);
      }

      const { data, error } = await query.select().single();

      if (error || !data) {
        return res.status(404).json({ error: 'Generation not found' });
      }

      res.json({ success: true, message: 'Generation deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
