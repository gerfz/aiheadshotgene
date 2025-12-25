import { Router, Response } from 'express';
import { verifyToken, verifyGuestOnly, AuthenticatedRequest } from '../middleware/auth';
import { 
  getUserProfile, 
  getUserGenerations, 
  supabaseAdmin,
  getOrCreateGuestProfile,
  getGuestGenerations,
  migrateGuestToUser
} from '../services/supabase';

const router = Router();

// =============================================
// AUTHENTICATED USER ENDPOINTS
// =============================================

// Get user credits
router.get(
  '/credits',
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const profile = await getUserProfile(userId);

      res.json({
        freeCredits: profile.free_credits,
        isSubscribed: profile.is_subscribed,
        hasCredits: profile.is_subscribed || profile.free_credits > 0,
        emailVerified: profile.email_verified || false
      });
    } catch (error: any) {
      // If profile doesn't exist, create it
      if (error.code === 'PGRST116') {
        try {
          const { data, error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: req.userId,
              email: req.userEmail,
              free_credits: 3,
              is_subscribed: false,
              email_verified: true,
              credits_awarded: true
            })
            .select()
            .single();

          if (insertError) throw insertError;

          return res.json({
            freeCredits: data.free_credits,
            isSubscribed: data.is_subscribed,
            hasCredits: true,
            emailVerified: data.email_verified || false
          });
        } catch (insertErr: any) {
          return res.status(500).json({ error: insertErr.message });
        }
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// Get user's generation history
router.get(
  '/generations',
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const generations = await getUserGenerations(userId);

      res.json({ generations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update subscription status (called by webhook or RevenueCat)
router.post(
  '/subscription',
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { isSubscribed } = req.body;

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ is_subscribed: isSubscribed })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        isSubscribed: data.is_subscribed
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Migrate guest data to user account (called after signup)
router.post(
  '/migrate-guest',
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { guestDeviceId } = req.body;

      if (!guestDeviceId) {
        return res.status(400).json({ error: 'Guest device ID is required' });
      }

      await migrateGuestToUser(guestDeviceId, userId);

      res.json({
        success: true,
        message: 'Guest data migrated successfully'
      });
    } catch (error: any) {
      // If migration fails (e.g., no guest data), still return success
      console.error('Migration error:', error);
      res.json({
        success: true,
        message: 'Migration completed (no guest data to migrate)'
      });
    }
  }
);

// =============================================
// GUEST USER ENDPOINTS
// =============================================

// Get guest credits
router.get(
  '/guest/credits',
  verifyGuestOnly,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deviceId = req.guestDeviceId!;
      const profile = await getOrCreateGuestProfile(deviceId);

      res.json({
        freeCredits: profile.free_credits,
        isSubscribed: false,
        hasCredits: profile.free_credits > 0,
        isGuest: true
      });
    } catch (error: any) {
      console.error('Guest credits error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get guest's generation history
router.get(
  '/guest/generations',
  verifyGuestOnly,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deviceId = req.guestDeviceId!;
      const generations = await getGuestGenerations(deviceId);

      res.json({ generations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
