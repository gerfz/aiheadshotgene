import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase';

const router = Router();

/**
 * RevenueCat Webhook Handler
 * Handles subscription events from RevenueCat
 * 
 * Events handled:
 * - INITIAL_PURCHASE: New subscription (trial or paid)
 * - RENEWAL: Weekly subscription renewal
 * - CANCELLATION: Subscription cancelled
 * - EXPIRATION: Subscription expired
 * - TRIAL_STARTED: Trial started (if using RevenueCat trials)
 * - TRIAL_CONVERTED: Trial converted to paid
 */
router.post('/revenuecat', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    
    console.log('📥 RevenueCat webhook received:', event.type);
    
    // Extract user ID from app_user_id
    const userId = event.event?.app_user_id;
    if (!userId) {
      console.error('❌ No app_user_id in webhook');
      return res.status(400).json({ error: 'Missing app_user_id' });
    }
    
    const eventType = event.type;
    const productId = event.event?.product_id;
    const isTrialPeriod = event.event?.is_trial_period || false;
    const isTrialConversion = event.event?.is_trial_conversion || false;
    
    console.log(`📊 Event details: User=${userId.slice(0, 8)}..., Type=${eventType}, Product=${productId}, Trial=${isTrialPeriod}, Conversion=${isTrialConversion}`);
    
    // Get current user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Failed to get user profile:', profileError);
      return res.status(404).json({ error: 'User not found' });
    }
    
    switch (eventType) {
      case 'INITIAL_PURCHASE':
        if (isTrialPeriod) {
          // Trial started via RevenueCat
          console.log(`🎁 Trial started for user ${userId.slice(0, 8)}...`);
          
          const trialEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
          
          await supabaseAdmin
            .from('profiles')
            .update({
              is_trial_active: true,
              trial_start_date: new Date(),
              trial_end_date: trialEndDate,
              total_credits: (profile.total_credits || 0) + 1000,
              is_subscribed: false // Not subscribed yet, just trial
            })
            .eq('id', userId);
          
          console.log(`✅ Trial activated: 1000 credits added`);
        } else {
          // Direct purchase without trial
          console.log(`✨ New subscription for user ${userId.slice(0, 8)}...`);
          
          await supabaseAdmin
            .from('profiles')
            .update({
              is_subscribed: true,
              is_trial_active: false,
              total_credits: (profile.total_credits || 0) + 3000
            })
            .eq('id', userId);
          
          console.log(`✅ Subscription activated: 3000 credits added`);
        }
        break;
      
      case 'RENEWAL':
        // Weekly subscription renewal
        console.log(`🔄 Renewal for user ${userId.slice(0, 8)}...`);
        
        await supabaseAdmin
          .from('profiles')
          .update({
            is_subscribed: true,
            total_credits: (profile.total_credits || 0) + 3000
          })
          .eq('id', userId);
        
        console.log(`✅ Renewal processed: 3000 credits added (total: ${(profile.total_credits || 0) + 3000})`);
        break;
      
      case 'TRIAL_CONVERTED':
      case 'CONVERSION_FROM_TRIAL':
        // Trial converted to paid subscription
        console.log(`🎉 Trial conversion for user ${userId.slice(0, 8)}...`);
        
        await supabaseAdmin
          .from('profiles')
          .update({
            is_subscribed: true,
            is_trial_active: false,
            total_credits: (profile.total_credits || 0) + 2000 // Add 2000 more (already have 1000 from trial)
          })
          .eq('id', userId);
        
        console.log(`✅ Trial converted: 2000 additional credits added`);
        break;
      
      case 'CANCELLATION':
        // Subscription cancelled (but may still be active until period end)
        console.log(`⚠️ Subscription cancelled for user ${userId.slice(0, 8)}...`);
        
        // Don't immediately revoke access - let it expire naturally
        // Just log the cancellation
        console.log(`ℹ️ Subscription will remain active until expiration`);
        break;
      
      case 'EXPIRATION':
        // Subscription expired
        console.log(`❌ Subscription expired for user ${userId.slice(0, 8)}...`);
        
        await supabaseAdmin
          .from('profiles')
          .update({
            is_subscribed: false,
            is_trial_active: false
          })
          .eq('id', userId);
        
        console.log(`✅ Subscription deactivated (credits preserved: ${profile.total_credits || 0})`);
        break;
      
      case 'TRIAL_STARTED':
        // Trial started (alternative event name)
        console.log(`🎁 Trial started for user ${userId.slice(0, 8)}...`);
        
        const trialEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        
        await supabaseAdmin
          .from('profiles')
          .update({
            is_trial_active: true,
            trial_start_date: new Date(),
            trial_end_date: trialEnd,
            total_credits: (profile.total_credits || 0) + 1000
          })
          .eq('id', userId);
        
        console.log(`✅ Trial activated: 1000 credits added`);
        break;
      
      default:
        console.log(`ℹ️ Unhandled event type: ${eventType}`);
    }
    
    // Sync subscription status across device if device_id exists
    if (profile.device_id) {
      const { data: updatedProfile } = await supabaseAdmin
        .from('profiles')
        .select('is_subscribed, is_trial_active')
        .eq('id', userId)
        .single();
      
      if (updatedProfile) {
        await supabaseAdmin
          .from('profiles')
          .update({
            is_subscribed: updatedProfile.is_subscribed,
            is_trial_active: updatedProfile.is_trial_active
          })
          .eq('device_id', profile.device_id)
          .neq('id', userId);
        
        console.log(`✅ Synced subscription status across device ${profile.device_id}`);
      }
    }
    
    res.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stripe Webhook Handler (for credit pack purchases)
 * Handles payment events from Stripe
 */
router.post('/stripe', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    
    console.log('📥 Stripe webhook received:', event.type);
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.client_reference_id;
        const packId = session.metadata?.pack_id;
        const credits = parseInt(session.metadata?.credits || '0');
        
        if (!userId || !packId || !credits) {
          console.error('❌ Missing required metadata in Stripe session');
          return res.status(400).json({ error: 'Invalid session data' });
        }
        
        console.log(`💳 Credit pack purchase: User=${userId.slice(0, 8)}..., Pack=${packId}, Credits=${credits}`);
        
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
            transaction_id: session.id,
            pack_id: packId,
            credits_added: credits,
            transaction_type: 'purchase',
            amount: session.amount_total / 100, // Convert from cents
            currency: session.currency
          });
        
        console.log(`✅ Credits added: ${credits} (new total: ${result[0].new_total})`);
        break;
      
      default:
        console.log(`ℹ️ Unhandled Stripe event: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error: any) {
    console.error('❌ Stripe webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
