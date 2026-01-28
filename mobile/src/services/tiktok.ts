/**
 * TikTok Business SDK Service
 * 
 * This service handles TikTok SDK initialization and event tracking
 * for advertising and analytics purposes.
 * 
 * IMPORTANT: For proper attribution tracking:
 * 1. Initialize TikTok SDK BEFORE other analytics SDKs
 * 2. Track InstallApp event immediately on first launch
 * 3. Use unique event_id for deduplication
 */

import tiktokSDK from '../../libs/tiktok-sdk';
import { Platform } from 'react-native';

// Helper to generate unique event IDs for deduplication
const generateEventId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// TikTok Business SDK Configuration
// Credentials from TikTok Events Manager
const TIKTOK_CONFIG = {
  appId: 'com.aiportrait.studio',
  tiktokAppId: '7596076889249218568',
  accessToken: 'TTY6OCuPwnlefc2VSlanM2a0Yg0vxDH7', // App Secret
  debugMode: false, // FALSE = Production mode (real events for campaigns)
};

// Debug mode info:
// When debugMode = true: Events appear in "Test Events" tab (for testing only)
// When debugMode = false: Events are REAL and used for app verification and reporting
// Status will change from "Pending Verification" to "Verified" once real events are received
// ⚠️ REMEMBER: Set debugMode = false before production build!

class TikTokService {
  private isInitialized = false;

  /**
   * Initialize TikTok SDK
   * Call this once when the app starts
   */
  async initialize(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.log('TikTok SDK: Skipping initialization (not Android)');
      return;
    }

    if (this.isInitialized) {
      console.log('TikTok SDK: Already initialized');
      return;
    }

    try {
      console.log('TikTok SDK: Initializing...');
      await tiktokSDK.initialize(TIKTOK_CONFIG);
      
      if (TIKTOK_CONFIG.debugMode) {
        console.log('TikTok SDK: Debug mode enabled - events will appear in Test Events tab');
      }
      
      this.isInitialized = true;
      console.log('TikTok SDK: Initialized successfully');
    } catch (error) {
      console.error('TikTok SDK: Initialization failed:', error);
    }
  }

  /**
   * Identify user for TikTok tracking
   * Should be called when:
   * - User logs in
   * - New user signs up
   * - User updates profile
   * - App reopens with remembered user
   */
  async identifyUser(userId: string, email?: string, phone?: string, username?: string): Promise<void> {
    try {
      await tiktokSDK.identify(
        userId,
        username || '',
        phone || '',
        email || ''
      );
      console.log('TikTok SDK: User identified');
    } catch (error) {
      console.error('TikTok SDK: Failed to identify user:', error);
    }
  }

  /**
   * Track app install event (first launch only)
   * CRITICAL: This must be called on first app launch for proper attribution
   * Install Referrer data is automatically captured by TikTok SDK
   */
  async trackAppInstall(): Promise<void> {
    try {
      const eventId = generateEventId();
      console.log('🎯 TikTok SDK: Tracking InstallApp event with ID:', eventId);
      
      await tiktokSDK.trackInstall(eventId);
      
      console.log('✅ TikTok SDK: App install tracked successfully');
      console.log('📊 TikTok SDK: Event will appear in TikTok Events Manager within 5-10 minutes');
    } catch (error) {
      console.error('❌ TikTok SDK: Failed to track app install:', error);
      throw error; // Re-throw so caller knows it failed
    }
  }

  /**
   * Track app launch event
   */
  async trackAppLaunch(): Promise<void> {
    try {
      await tiktokSDK.trackLaunch();
      console.log('TikTok SDK: App launch tracked');
    } catch (error) {
      console.error('TikTok SDK: Failed to track app launch:', error);
    }
  }

  /**
   * Track user login
   */
  async trackLogin(): Promise<void> {
    try {
      await tiktokSDK.trackLogin();
      console.log('TikTok SDK: Login tracked');
    } catch (error) {
      console.error('TikTok SDK: Failed to track login:', error);
    }
  }

  /**
   * Track user registration
   * Call this when user creates an account or completes onboarding
   */
  async trackRegistration(): Promise<void> {
    try {
      const eventId = generateEventId();
      console.log('🎯 TikTok SDK: Tracking Registration event with ID:', eventId);
      
      await tiktokSDK.trackRegistration(eventId);
      
      console.log('✅ TikTok SDK: Registration tracked successfully');
    } catch (error) {
      console.error('❌ TikTok SDK: Failed to track registration:', error);
    }
  }

  /**
   * Track subscription purchase
   * IMPORTANT: This is a key conversion event for TikTok optimization
   */
  async trackSubscriptionPurchase(
    productId: string,
    price: number,
    currency: string = 'USD'
  ): Promise<void> {
    try {
      const eventId = generateEventId();
      console.log('🎯 TikTok SDK: Tracking subscription purchase:', { productId, price, currency });
      
      // Track Subscribe event (predefined event for subscriptions)
      await tiktokSDK.trackSubscribe();
      
      // Also track as Purchase event with revenue details
      // TikTok uses this for ROAS optimization
      await tiktokSDK.trackEvent({
        eventName: 'Purchase',
        properties: {
          event_id: eventId,
          value: price,
          currency: currency,
          content_type: 'subscription',
          content_id: productId,
          timestamp: Date.now(),
        }
      });
      
      console.log('✅ TikTok SDK: Subscription purchase tracked (Subscribe + Purchase events)');
    } catch (error) {
      console.error('❌ TikTok SDK: Failed to track subscription purchase:', error);
    }
  }

  /**
   * Track credit purchase
   */
  async trackCreditPurchase(
    credits: number,
    price: number,
    currency: string = 'USD'
  ): Promise<void> {
    try {
      await tiktokSDK.trackPurchase(price, currency, 'credits', `credits_${credits}`);
      console.log('TikTok SDK: Credit purchase tracked');
    } catch (error) {
      console.error('TikTok SDK: Failed to track credit purchase:', error);
    }
  }

  /**
   * Track portrait generation
   * This is a key engagement event showing app usage
   */
  async trackPortraitGeneration(style: string, count: number): Promise<void> {
    try {
      const eventId = generateEventId();
      await tiktokSDK.trackEvent({
        eventName: 'portrait_generated',
        properties: {
          event_id: eventId,
          style,
          count,
          timestamp: Date.now(),
        },
      });
      console.log('✅ TikTok SDK: Portrait generation tracked:', { style, count });
    } catch (error) {
      console.error('❌ TikTok SDK: Failed to track portrait generation:', error);
    }
  }

  /**
   * Track portrait view
   */
  async trackPortraitView(portraitId: string, style: string): Promise<void> {
    try {
      await tiktokSDK.trackContentView('portrait', portraitId);
      console.log('TikTok SDK: Portrait view tracked');
    } catch (error) {
      console.error('TikTok SDK: Failed to track portrait view:', error);
    }
  }

  /**
   * Track portrait share
   */
  async trackPortraitShare(portraitId: string, platform: string): Promise<void> {
    try {
      await tiktokSDK.trackEvent({
        eventName: 'portrait_shared',
        properties: {
          portrait_id: portraitId,
          platform,
          timestamp: Date.now(),
        },
      });
      console.log('TikTok SDK: Portrait share tracked');
    } catch (error) {
      console.error('TikTok SDK: Failed to track portrait share:', error);
    }
  }

  /**
   * Track portrait download
   */
  async trackPortraitDownload(portraitId: string): Promise<void> {
    try {
      await tiktokSDK.trackEvent({
        eventName: 'portrait_downloaded',
        properties: {
          portrait_id: portraitId,
          timestamp: Date.now(),
        },
      });
      console.log('TikTok SDK: Portrait download tracked');
    } catch (error) {
      console.error('TikTok SDK: Failed to track portrait download:', error);
    }
  }

  /**
   * Track style selection
   */
  async trackStyleSelection(style: string): Promise<void> {
    try {
      await tiktokSDK.trackEvent({
        eventName: 'style_selected',
        properties: {
          style,
          timestamp: Date.now(),
        },
      });
      console.log('TikTok SDK: Style selection tracked');
    } catch (error) {
      console.error('TikTok SDK: Failed to track style selection:', error);
    }
  }

  /**
   * Track subscription view
   * Important funnel event showing user interest in subscribing
   */
  async trackSubscriptionView(): Promise<void> {
    try {
      const eventId = generateEventId();
      await tiktokSDK.trackEvent({
        eventName: 'subscription_viewed',
        properties: {
          event_id: eventId,
          timestamp: Date.now(),
        },
      });
      console.log('✅ TikTok SDK: Subscription view tracked');
    } catch (error) {
      console.error('❌ TikTok SDK: Failed to track subscription view:', error);
    }
  }

  /**
   * Track complete registration (onboarding completed)
   * Use this for "Complete Registration" standard event
   */
  async trackCompleteRegistration(): Promise<void> {
    try {
      const eventId = generateEventId();
      console.log('🎯 TikTok SDK: Tracking CompleteRegistration event');
      
      await tiktokSDK.trackEvent({
        eventName: 'CompleteRegistration',
        properties: {
          event_id: eventId,
          timestamp: Date.now(),
        },
      });
      
      console.log('✅ TikTok SDK: CompleteRegistration tracked');
    } catch (error) {
      console.error('❌ TikTok SDK: Failed to track CompleteRegistration:', error);
    }
  }
}

// Export singleton instance
export const tiktokService = new TikTokService();
export default tiktokService;
