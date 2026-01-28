/**
 * Airbridge MMP Service
 * 
 * This service handles Airbridge SDK initialization and event tracking
 * for proper attribution of TikTok ads (and other ad sources).
 * 
 * IMPORTANT: Airbridge handles ATTRIBUTION (linking installs to ads)
 * TikTok Business SDK handles EVENT TRACKING (sending events to TikTok)
 * Both work together via deduplication using event_id.
 */

import Airbridge from 'airbridge-react-native-sdk';
import { Platform } from 'react-native';

// Airbridge credentials from dashboard
const AIRBRIDGE_CONFIG = {
  appName: 'aiheadshot',                      // Your app name from Airbridge
  appToken: '4c1ca9ea73e642838ceec45b7f01d643',  // Your app SDK token
};

class AirbridgeService {
  private isInitialized = false;

  /**
   * Initialize Airbridge SDK
   * Call this EARLY in app startup (in _layout.tsx)
   */
  async initialize(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.log('Airbridge: Skipping initialization (not Android)');
      return;
    }

    if (this.isInitialized) {
      console.log('Airbridge: Already initialized');
      return;
    }

    try {
      console.log('🌉 Airbridge: Initializing...');
      
      const option = {
        appName: AIRBRIDGE_CONFIG.appName,
        appToken: AIRBRIDGE_CONFIG.appToken,
        // Optional: Enable detailed logging for debugging
        // logLevel: 'debug',
      };

      await Airbridge.initialize(option);
      
      this.isInitialized = true;
      console.log('✅ Airbridge: Initialized successfully');
      console.log('📊 Airbridge: Attribution and event tracking active');
    } catch (error) {
      console.error('❌ Airbridge: Initialization failed:', error);
      // Don't throw - app should continue even if Airbridge fails
    }
  }

  /**
   * Set user identifier
   * Call this when user logs in or signs up
   */
  async setUser(userId: string, email?: string): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Airbridge: Not initialized, skipping setUser');
      return;
    }

    try {
      // Set user ID
      await Airbridge.setUserID(userId);
      
      // Set user email if available
      if (email) {
        await Airbridge.setUserEmail(email);
      }
      
      console.log('Airbridge: User identified:', userId);
    } catch (error) {
      console.error('Airbridge: Failed to set user:', error);
    }
  }

  /**
   * Track custom event with properties
   * 
   * NOTE: Airbridge automatically tracks Install event
   * You don't need to manually track it!
   */
  async trackEvent(eventName: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Airbridge: Not initialized, skipping event:', eventName);
      return;
    }

    try {
      const event = {
        category: eventName,
        action: eventName,
        label: properties?.label || eventName,
        value: properties?.value || 0,
        customAttributes: properties || {},
      };

      await Airbridge.trackEvent(event);
      console.log('Airbridge: Event tracked:', eventName);
    } catch (error) {
      console.error('Airbridge: Failed to track event:', error);
    }
  }

  /**
   * Track registration/sign up
   * Maps to TikTok's "Registration" event
   */
  async trackSignUp(userId: string, method?: string): Promise<void> {
    await this.setUser(userId);
    await this.trackEvent('sign_up', {
      method: method || 'anonymous',
    });
  }

  /**
   * Track complete registration (after onboarding)
   * Maps to TikTok's "CompleteRegistration" event
   */
  async trackCompleteRegistration(userId: string): Promise<void> {
    await this.trackEvent('complete_registration', {
      user_id: userId,
    });
  }

  /**
   * Track purchase/subscription
   * Maps to TikTok's "Purchase" event
   */
  async trackPurchase(
    revenue: number,
    currency: string = 'USD',
    productId?: string,
    quantity: number = 1
  ): Promise<void> {
    await this.trackEvent('purchase', {
      value: revenue,
      currency,
      product_id: productId,
      quantity,
    });
  }

  /**
   * Track subscription
   * Maps to TikTok's "Subscribe" event
   */
  async trackSubscribe(
    revenue: number,
    currency: string = 'USD',
    subscriptionId?: string
  ): Promise<void> {
    await this.trackEvent('subscribe', {
      value: revenue,
      currency,
      subscription_id: subscriptionId,
    });
  }

  /**
   * Track content view
   * Maps to TikTok's "ViewContent" event
   */
  async trackContentView(contentType: string, contentId: string): Promise<void> {
    await this.trackEvent('view_content', {
      content_type: contentType,
      content_id: contentId,
    });
  }

  /**
   * Track app open/launch
   * Useful for engagement tracking
   */
  async trackAppOpen(): Promise<void> {
    await this.trackEvent('app_open');
  }

  /**
   * Get deep link data
   * Useful for deferred deep linking and campaign tracking
   */
  async getDeeplinkData(): Promise<any> {
    try {
      const deeplink = await Airbridge.getDeeplink();
      console.log('Airbridge: Deeplink data:', deeplink);
      return deeplink;
    } catch (error) {
      console.error('Airbridge: Failed to get deeplink:', error);
      return null;
    }
  }

  /**
   * Clear user data (on logout)
   */
  async clearUser(): Promise<void> {
    try {
      await Airbridge.clearUserID();
      await Airbridge.clearUserEmail();
      console.log('Airbridge: User data cleared');
    } catch (error) {
      console.error('Airbridge: Failed to clear user:', error);
    }
  }
}

// Export singleton instance
export const airbridgeService = new AirbridgeService();
export default airbridgeService;
