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
      
      // First, check if email is verified in auth.users
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const isEmailVerified = authUser?.user?.email_confirmed_at !== null;
      
      // Get profile
      const profile = await getUserProfile(userId);
      
      // If email is verified in auth but not in profile, sync it
      if (isEmailVerified && !profile.email_verified && !profile.credits_awarded) {
        // Award credits for verification
        await supabaseAdmin
          .from('profiles')
          .update({
            email_verified: true,
            credits_awarded: true,
            free_credits: profile.free_credits + 3
          })
          .eq('id', userId);
        
        // Refetch profile
        const { data: updatedProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (updatedProfile) {
          return res.json({
            freeCredits: updatedProfile.free_credits,
            isSubscribed: updatedProfile.is_subscribed,
            hasCredits: updatedProfile.is_subscribed || updatedProfile.free_credits > 0,
            emailVerified: true
          });
        }
      }

      res.json({
        freeCredits: profile.free_credits,
        isSubscribed: profile.is_subscribed,
        hasCredits: profile.is_subscribed || profile.free_credits > 0,
        emailVerified: isEmailVerified || profile.email_verified || false
      });
    } catch (error: any) {
      // If profile doesn't exist, create it with device tracking
      if (error.code === 'PGRST116') {
        try {
          // Get device_id from auth metadata
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(req.userId!);
          const deviceId = authUser?.user?.user_metadata?.device_id;
          
          // Check if this device has already been used
          let freeCredits = 3; // Default for new devices
          let isSubscribed = false;
          
          if (deviceId) {
            const { data: existingProfile } = await supabaseAdmin
              .from('profiles')
              .select('id, free_credits, is_subscribed')
              .eq('device_id', deviceId)
              .order('created_at', { ascending: true })
              .limit(1)
              .single();
            
            // If device was already used, copy credits from original account
            if (existingProfile) {
              freeCredits = existingProfile.free_credits;
              isSubscribed = existingProfile.is_subscribed;
              console.log(`⚠️ Device ${deviceId} already used, copying ${freeCredits} credits from existing account`);
            }
          }
          
          const { data, error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: req.userId,
              email: req.userEmail,
              free_credits: freeCredits,
              is_subscribed: isSubscribed,
              email_verified: true,
              credits_awarded: true,
              device_id: deviceId || null
            })
            .select()
            .single();

          if (insertError) throw insertError;

          return res.json({
            freeCredits: data.free_credits,
            isSubscribed: data.is_subscribed,
            hasCredits: data.free_credits > 0 || data.is_subscribed,
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

      // Get the user's profile to find their device_id
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('device_id')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Update subscription status for this user
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ is_subscribed: isSubscribed })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // If device_id exists, sync subscription status to all profiles with same device_id
      if (profile.device_id) {
        const { error: syncError } = await supabaseAdmin
          .from('profiles')
          .update({ is_subscribed: isSubscribed })
          .eq('device_id', profile.device_id)
          .neq('id', userId); // Don't update the current user again

        if (syncError) {
          console.error('Failed to sync subscription status across device_id:', syncError);
          // Don't throw - main update succeeded
        } else {
          console.log(`✅ Synced subscription status (${isSubscribed}) across device_id: ${profile.device_id}`);
        }
      }

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
