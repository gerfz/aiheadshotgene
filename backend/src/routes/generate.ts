import { Router, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';
import { generationRateLimiter } from '../middleware/rateLimiter';
import { generatePortrait, getAvailableStyles } from '../services/nanoBanana';
import {
  getUserProfile,
  decrementCredits,
  createGeneration,
  updateGeneration,
  uploadImage,
  incrementStyleUsage,
  getMostUsedStyles
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

// Get most used styles
router.get('/most-used-styles', async (req, res) => {
  try {
    const mostUsedStyles = await getMostUsedStyles();
    res.json({ mostUsedStyles });
  } catch (error: any) {
    console.error('Error fetching most used styles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate portrait (authenticated users only)
router.post(
  '/',
  verifyToken,
  generationRateLimiter, // Rate limiting: max 5 generations per minute
  upload.single('image'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { styleKey, customPrompt, editPrompt } = req.body;
      const file = req.file;

      console.log('Generate request - styleKey:', styleKey, 'customPrompt:', customPrompt, 'editPrompt:', editPrompt);

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

      // Validate edit style requires edit prompt
      if (styleKey === 'edit' && (!editPrompt || editPrompt.trim().length === 0)) {
        return res.status(400).json({ 
          error: 'Edit prompt is required',
          message: 'Please describe what you want to change'
        });
      }

      // Authenticated user flow
      const userId = req.userId!;
      const profile = await getUserProfile(userId);
      
      if (!profile.is_subscribed && profile.free_credits <= 0) {
        return res.status(403).json({ 
          error: 'No credits remaining',
          message: 'Please subscribe to continue generating portraits'
        });
      }
      
      const isSubscribed = profile.is_subscribed;
      const folderPath = userId;
      
      // Upload original image
      const originalFileName = `${folderPath}/${uuidv4()}-original.${file.mimetype.split('/')[1]}`;
      const originalImageUrl = await uploadImage(
        'portraits',
        originalFileName,
        file.buffer,
        file.mimetype
      );
      
      // For edit mode, keep the original styleKey, not 'edit'
      const actualStyleKey = styleKey === 'edit' && req.body.originalStyleKey 
        ? req.body.originalStyleKey 
        : styleKey;
      
      const isEdited = styleKey === 'edit';
      
      // Create generation record with 'queued' status
      const generation = await createGeneration(userId, actualStyleKey, originalImageUrl, customPrompt, isEdited);

      // Decrement credits immediately (before job is queued)
      if (!isSubscribed) {
        try {
          await decrementCredits(userId);
        } catch (creditError: any) {
          // If credit decrement fails, delete the generation and fail
          await require('../services/supabase').supabaseAdmin
            .from('generations')
            .delete()
            .eq('id', generation.id);
          
          return res.status(403).json({
            error: 'Failed to use credit',
            message: creditError.message || 'Could not decrement credits'
          });
        }
      }

      // Create job in queue
      const { data: job, error: jobError } = await require('../services/supabase').supabaseAdmin
        .from('generation_jobs')
        .insert({
          user_id: userId,
          generation_id: generation.id,
          status: 'queued',
          style_key: styleKey,
          custom_prompt: customPrompt,
          edit_prompt: editPrompt,
          original_image_url: originalImageUrl
        })
        .select()
        .single();

      if (jobError) {
        console.error('Failed to create job:', jobError);
        await updateGeneration(generation.id, { status: 'failed' });
        throw new Error('Failed to queue generation job');
      }

      // Track style usage
      await incrementStyleUsage(styleKey);

      console.log(`✅ Job created: ${job.id}, triggering worker...`);

      // Immediately trigger worker to pick up this job (don't wait for 2s interval)
      try {
        const { triggerWorker } = await import('../index');
        triggerWorker();
      } catch (e) {
        console.warn('⚠️ Could not trigger worker:', e);
        // Not critical, worker will pick it up on next interval
      }

      // Return immediately with 202 Accepted
      res.status(202).json({
        success: true,
        message: 'Generation queued successfully',
        generation: {
          id: generation.id,
          status: 'queued',
          jobId: job.id
        }
      });

    } catch (error: any) {
      console.error('Generation error:', error);
      res.status(500).json({ 
        error: 'Generation failed', 
        message: error.message 
      });
    }
  }
);

// Get generation status (authenticated users only)
router.get(
  '/:id/status',
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await require('../services/supabase').supabaseAdmin
        .from('generations')
        .select('*')
        .eq('id', id)
        .eq('user_id', req.userId)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Generation not found' });
      }

      // If generation failed, fetch the error message from generation_jobs table
      let errorMessage = null;
      if (data.status === 'failed') {
        const { data: jobData } = await require('../services/supabase').supabaseAdmin
          .from('generation_jobs')
          .select('error_message')
          .eq('generation_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (jobData?.error_message) {
          errorMessage = jobData.error_message;
        }
      }

      // Transform snake_case to camelCase for mobile app compatibility
      const generation = {
        id: data.id,
        userId: data.user_id,
        styleKey: data.style_key,
        originalImageUrl: data.original_image_url,
        generatedImageUrl: data.generated_image_url,
        customPrompt: data.custom_prompt,
        status: data.status,
        createdAt: data.created_at,
        isEdited: data.is_edited,
        errorMessage: errorMessage // Include error message if failed
      };

      res.json({ generation });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete generation (authenticated users only)
router.delete(
  '/:id',
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await require('../services/supabase').supabaseAdmin
        .from('generations')
        .delete()
        .eq('id', id)
        .eq('user_id', req.userId)
        .select()
        .single();

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
