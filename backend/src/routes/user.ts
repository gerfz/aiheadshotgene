import { Router, Response } from 'express';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';
import { 
  getUserProfile, 
  getUserGenerations, 
  supabaseAdmin
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
      
      // Get profile first (fastest query)
      const profile = await getUserProfile(userId);
      
      // Check if email is verified in auth.users (only if needed)
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const isEmailVerified = authUser?.user?.email_confirmed_at !== null;
      
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
          // Get device_id and previous_user_id from auth metadata
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(req.userId!);
          const deviceId = authUser?.user?.user_metadata?.device_id;
          const previousUserId = authUser?.user?.user_metadata?.previous_user_id;
          
          // Check if this device has already been used
          let freeCredits = 2; // Default for new devices (changed from 5 to 2)
          let isSubscribed = false;
          
          // 🔥 PRIORITY 1: Try to get data from previous_user_id (most accurate)
          if (previousUserId) {
            const { data: previousProfile } = await supabaseAdmin
              .from('profiles')
              .select('free_credits, is_subscribed')
              .eq('id', previousUserId)
              .single();
            
            if (previousProfile) {
              freeCredits = previousProfile.free_credits;
              isSubscribed = previousProfile.is_subscribed;
              console.log(`✅ Restored state from previous user ${previousUserId}: ${freeCredits} credits, subscribed: ${isSubscribed}`);
            }
          }
          // 🔥 FALLBACK: If no previous_user_id, check by device_id
          else if (deviceId) {
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

// Award credits for rating the app
router.post(
  '/rate-reward',
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      
      // Get current profile
      const profile = await getUserProfile(userId);
      
      // Award 2 credits for rating
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          free_credits: profile.free_credits + 2
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`✅ Awarded 2 rating credits to user ${userId}`);
      
      res.json({
        success: true,
        freeCredits: data.free_credits
      });
    } catch (error: any) {
      console.error('Error awarding rating credits:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
