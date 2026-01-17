/**
 * TikTok Business SDK Service
 * 
 * This service handles TikTok SDK initialization and event tracking
 * for advertising and analytics purposes.
 */

import tiktokSDK from '../../libs/tiktok-sdk';
import { Platform } from 'react-native';

// TikTok Business SDK Configuration
// Credentials from TikTok Events Manager
const TIKTOK_CONFIG = {
  appId: 'com.aiportrait.studio',
  tiktokAppId: '7596076889249218568',
  accessToken: 'TTY6OCuPwnlefc2VSlanM2a0Yg0vxDH7', // App Secret
};

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
      this.isInitialized = true;
      console.log('TikTok SDK: Initialized successfully');
      
      // Track app launch
      await this.trackAppLaunch();
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
   */
  async trackRegistration(): Promise<void> {
    try {
      await tiktokSDK.trackRegistration();
      console.log('TikTok SDK: Registration tracked');
    } catch (error) {
      console.error('TikTok SDK: Failed to track registration:', error);
    }
  }

  /**
   * Track subscription purchase
   */
  async trackSubscriptionPurchase(
    productId: string,
    price: number,
    currency: string = 'USD'
  ): Promise<void> {
    try {
      // Use Subscribe event for subscriptions
      await tiktokSDK.trackSubscribe();
      // Also track as purchase with details
      await tiktokSDK.trackPurchase(price, currency, 'subscription', productId);
      console.log('TikTok SDK: Subscription purchase tracked');
    } catch (error) {
      console.error('TikTok SDK: Failed to track purchase:', error);
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
   */
  async trackPortraitGeneration(style: string, count: number): Promise<void> {
    try {
      await tiktokSDK.trackEvent({
        eventName: 'portrait_generated',
        properties: {
          style,
          count,
          timestamp: Date.now(),
        },
      });
      console.log('TikTok SDK: Portrait generation tracked');
    } catch (error) {
      console.error('TikTok SDK: Failed to track portrait generation:', error);
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
   */
  async trackSubscriptionView(): Promise<void> {
    try {
      await tiktokSDK.trackEvent({
        eventName: 'subscription_viewed',
        properties: {
          timestamp: Date.now(),
        },
      });
      console.log('TikTok SDK: Subscription view tracked');
    } catch (error) {
      console.error('TikTok SDK: Failed to track subscription view:', error);
    }
  }
}

// Export singleton instance
export const tiktokService = new TikTokService();
export default tiktokService;
