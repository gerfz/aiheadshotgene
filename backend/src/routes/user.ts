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
      
      // Check if trial has expired
      const now = new Date();
      const trialExpired = profile.is_trial_active && 
                          profile.trial_end_date && 
                          new Date(profile.trial_end_date) < now;
      
      if (trialExpired) {
        // Expire the trial
        await supabaseAdmin
          .from('profiles')
          .update({ is_trial_active: false })
          .eq('id', userId);
        profile.is_trial_active = false;
      }
      
      // Calculate trial days remaining
      let trialDaysRemaining = 0;
      if (profile.is_trial_active && profile.trial_end_date) {
        const endDate = new Date(profile.trial_end_date);
        const diffTime = endDate.getTime() - now.getTime();
        trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      res.json({
        totalCredits: profile.total_credits || 0,
        isSubscribed: profile.is_subscribed,
        hasCredits: profile.is_subscribed || (profile.total_credits || 0) > 0,
        isTrialActive: profile.is_trial_active || false,
        trialEndsAt: profile.trial_end_date || null,
        trialDaysRemaining: trialDaysRemaining,
        canGenerate: profile.is_subscribed || (profile.total_credits || 0) >= 200,
        canEdit: profile.is_subscribed || (profile.total_credits || 0) >= 50
      });
    } catch (error: any) {
      // If profile doesn't exist, create it with trial
      if (error.code === 'PGRST116') {
        try {
          // Get device_id and previous_user_id from auth metadata
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(req.userId!);
          const deviceId = authUser?.user?.user_metadata?.device_id;
          const previousUserId = authUser?.user?.user_metadata?.previous_user_id;
          
          // Check if this device has already been used
          let totalCredits = 0;
          let isSubscribed = false;
          let isTrialActive = false;
          let trialStartDate = null;
          let trialEndDate = null;
          
          // 🔥 PRIORITY 1: Try to get data from previous_user_id (most accurate)
          if (previousUserId) {
            const { data: previousProfile } = await supabaseAdmin
              .from('profiles')
              .select('total_credits, is_subscribed, is_trial_active, trial_start_date, trial_end_date')
              .eq('id', previousUserId)
              .single();
            
            if (previousProfile) {
              totalCredits = previousProfile.total_credits || 0;
              isSubscribed = previousProfile.is_subscribed;
              isTrialActive = previousProfile.is_trial_active || false;
              trialStartDate = previousProfile.trial_start_date;
              trialEndDate = previousProfile.trial_end_date;
              console.log(`✅ Restored state from previous user ${previousUserId}: ${totalCredits} credits, subscribed: ${isSubscribed}`);
            }
          }
          // 🔥 FALLBACK: If no previous_user_id, check by device_id
          else if (deviceId) {
            const { data: existingProfile } = await supabaseAdmin
              .from('profiles')
              .select('id, total_credits, is_subscribed, is_trial_active, trial_start_date, trial_end_date')
              .eq('device_id', deviceId)
              .order('created_at', { ascending: true })
              .limit(1)
              .single();
            
            // If device was already used, copy state from original account
            if (existingProfile) {
              totalCredits = existingProfile.total_credits || 0;
              isSubscribed = existingProfile.is_subscribed;
              isTrialActive = existingProfile.is_trial_active || false;
              trialStartDate = existingProfile.trial_start_date;
              trialEndDate = existingProfile.trial_end_date;
              console.log(`⚠️ Device ${deviceId} already used, copying state from existing account`);
            }
          }
          
          // If new device and not subscribed, start trial
          if (!isSubscribed && !isTrialActive && !trialStartDate) {
            isTrialActive = true;
            trialStartDate = new Date();
            trialEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
            totalCredits = 1000; // Trial credits
            console.log(`🎁 Starting 3-day trial for new user ${req.userId}`);
          }
          
          const { data, error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: req.userId,
              email: req.userEmail,
              total_credits: totalCredits,
              is_subscribed: isSubscribed,
              is_trial_active: isTrialActive,
              trial_start_date: trialStartDate,
              trial_end_date: trialEndDate,
              email_verified: true,
              credits_awarded: true,
              device_id: deviceId || null
            })
            .select()
            .single();

          if (insertError) throw insertError;

          // Calculate trial days remaining
          let trialDaysRemaining = 0;
          if (data.is_trial_active && data.trial_end_date) {
            const now = new Date();
            const endDate = new Date(data.trial_end_date);
            const diffTime = endDate.getTime() - now.getTime();
            trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          return res.json({
            totalCredits: data.total_credits || 0,
            isSubscribed: data.is_subscribed,
            hasCredits: data.is_subscribed || (data.total_credits || 0) > 0,
            isTrialActive: data.is_trial_active || false,
            trialEndsAt: data.trial_end_date || null,
            trialDaysRemaining: trialDaysRemaining,
            canGenerate: data.is_subscribed || (data.total_credits || 0) >= 200,
            canEdit: data.is_subscribed || (data.total_credits || 0) >= 50
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
      const { isSubscribed, isRenewal, isTrialConversion } = req.body;

      // Get the user's profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('device_id, is_trial_active, total_credits, is_subscribed')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      let creditsToAdd = 0;
      
      // Determine how many credits to add
      if (isTrialConversion) {
        // Trial converting to paid: add 2000 more credits (they already have 1000 from trial)
        creditsToAdd = 2000;
        console.log(`🎉 Trial conversion for user ${userId}: adding ${creditsToAdd} credits`);
      } else if (isRenewal && isSubscribed) {
        // Weekly renewal: add 3000 credits
        creditsToAdd = 3000;
        console.log(`🔄 Weekly renewal for user ${userId}: adding ${creditsToAdd} credits`);
      } else if (isSubscribed && !profile?.is_subscribed) {
        // New subscription (not from trial): add 3000 credits
        creditsToAdd = 3000;
        console.log(`✨ New subscription for user ${userId}: adding ${creditsToAdd} credits`);
      }

      // Update subscription status and add credits
      const updateData: any = { 
        is_subscribed: isSubscribed,
        is_trial_active: false // End trial if converting
      };
      
      if (creditsToAdd > 0) {
        updateData.total_credits = (profile.total_credits || 0) + creditsToAdd;
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // If device_id exists, sync subscription status to all profiles with same device_id
      if (profile.device_id) {
        const { error: syncError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            is_subscribed: isSubscribed,
            is_trial_active: false
          })
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
        isSubscribed: data.is_subscribed,
        totalCredits: data.total_credits,
        creditsAdded: creditsToAdd
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Award credits for rating the app (DEPRECATED - keeping for backward compatibility)
router.post(
  '/rate-reward',
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      
      // Get current profile
      const profile = await getUserProfile(userId);
      
      // Award 400 credits for rating (equivalent to 2 generations in new system)
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          total_credits: (profile.total_credits || 0) + 400
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`✅ Awarded 400 rating credits to user ${userId}`);
      
      res.json({
        success: true,
        totalCredits: data.total_credits
      });
    } catch (error: any) {
      console.error('Error awarding rating credits:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Purchase credit pack
router.post(
  '/credits/purchase',
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { packId, credits, transactionId } = req.body;
      
      if (!packId || !credits || !transactionId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Verify transaction hasn't been processed already
      const { data: existingTransaction } = await supabaseAdmin
        .from('credit_transactions')
        .select('id')
        .eq('transaction_id', transactionId)
        .single();
      
      if (existingTransaction) {
        return res.status(400).json({ error: 'Transaction already processed' });
      }
      
      // Add credits using RPC function
      const { data: result, error: rpcError } = await supabaseAdmin
        .rpc('add_user_credits', {
          user_id: userId,
          credits_to_add: credits
        });
      
      if (rpcError) throw rpcError;
      
      // Log transaction
      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_id: transactionId,
          pack_id: packId,
          credits_added: credits,
          transaction_type: 'purchase'
        });
      
      console.log(`✅ Added ${credits} credits to user ${userId} (pack: ${packId})`);
      
      res.json({
        success: true,
        totalCredits: result[0].new_total
      });
    } catch (error: any) {
      console.error('Error purchasing credits:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Start trial for user
router.post(
  '/trial/start',
  verifyToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      
      // Check if user already had a trial
      const profile = await getUserProfile(userId);
      if (profile.trial_start_date) {
        return res.status(400).json({ error: 'Trial already used' });
      }
      
      // Start trial using RPC function
      const { data: result, error: rpcError } = await supabaseAdmin
        .rpc('start_user_trial', {
          user_id: userId,
          trial_credits: 1000
        });
      
      if (rpcError) throw rpcError;
      
      console.log(`✅ Started 3-day trial for user ${userId}`);
      
      res.json({
        success: true,
        trialEndsAt: result[0].trial_ends
      });
    } catch (error: any) {
      console.error('Error starting trial:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
