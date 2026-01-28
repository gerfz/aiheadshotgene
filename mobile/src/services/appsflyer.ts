/**
 * AppsFlyer MMP Service
 * 
 * This service handles AppsFlyer initialization and event tracking
 * for attribution and analytics purposes.
 * 
 * AppsFlyer is required for TikTok Ads attribution (SAN integration).
 */

import appsFlyer from 'react-native-appsflyer';
import { Platform } from 'react-native';

// AppsFlyer Configuration
const APPSFLYER_CONFIG = {
  devKey: 'XBVLr82a9ipt94MNoCgPXL',
  appId: 'com.aiportrait.studio', // iOS App ID (if you have iOS, use the numeric App Store ID)
  isDebug: false, // Set to true for testing
  onInstallConversionDataListener: true,
  onDeepLinkListener: false,
  timeToWaitForATTUserAuthorization: 10, // iOS only
};

class AppsFlyerService {
  private isInitialized = false;

  /**
   * Initialize AppsFlyer SDK
   * Call this once when the app starts, BEFORE other analytics SDKs
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('AppsFlyer: Already initialized');
      return;
    }

    try {
      console.log('AppsFlyer: Initializing...');
      
      await new Promise<void>((resolve, reject) => {
        appsFlyer.initSdk(
          APPSFLYER_CONFIG,
          (result) => {
            console.log('✅ AppsFlyer: Initialized successfully', result);
            this.isInitialized = true;
            resolve();
          },
          (error) => {
            console.error('❌ AppsFlyer: Initialization failed', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('❌ AppsFlyer: Initialization error:', error);
      // Don't throw - allow app to continue even if AppsFlyer fails
    }
  }

  /**
   * Set customer user ID for cross-platform tracking
   */
  setCustomerUserId(userId: string): void {
    try {
      appsFlyer.setCustomerUserId(userId);
      console.log('AppsFlyer: Customer user ID set:', userId);
    } catch (error) {
      console.error('AppsFlyer: Failed to set customer user ID:', error);
    }
  }

  /**
   * Log a custom event
   */
  async logEvent(eventName: string, eventValues: Record<string, any> = {}): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        appsFlyer.logEvent(
          eventName,
          eventValues,
          (result) => {
            console.log(`✅ AppsFlyer: Event logged - ${eventName}`, result);
            resolve();
          },
          (error) => {
            console.error(`❌ AppsFlyer: Failed to log event - ${eventName}`, error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error(`AppsFlyer: Event logging error - ${eventName}:`, error);
    }
  }

  /**
   * Track app install/first open
   * AppsFlyer automatically tracks installs, but this can be used for additional context
   */
  async trackInstall(): Promise<void> {
    // AppsFlyer tracks installs automatically on initSdk
    // This method is for any additional install-related tracking
    console.log('AppsFlyer: Install tracked automatically on init');
  }

  /**
   * Track user registration/signup
   */
  async trackRegistration(method: string = 'anonymous'): Promise<void> {
    await this.logEvent('af_complete_registration', {
      af_registration_method: method,
    });
  }

  /**
   * Track subscription purchase
   */
  async trackSubscription(
    price: number,
    currency: string = 'USD',
    productId: string
  ): Promise<void> {
    await this.logEvent('af_subscribe', {
      af_revenue: price,
      af_currency: currency,
      af_content_id: productId,
      af_content_type: 'subscription',
    });
  }

  /**
   * Track purchase event
   */
  async trackPurchase(
    price: number,
    currency: string = 'USD',
    productId: string,
    contentType: string = 'credits'
  ): Promise<void> {
    await this.logEvent('af_purchase', {
      af_revenue: price,
      af_currency: currency,
      af_content_id: productId,
      af_content_type: contentType,
    });
  }

  /**
   * Track content view
   */
  async trackContentView(contentId: string, contentType: string): Promise<void> {
    await this.logEvent('af_content_view', {
      af_content_id: contentId,
      af_content_type: contentType,
    });
  }

  /**
   * Track portrait generation
   */
  async trackPortraitGeneration(style: string, count: number): Promise<void> {
    await this.logEvent('portrait_generated', {
      style,
      count,
    });
  }

  /**
   * Track subscription view (paywall view)
   */
  async trackSubscriptionView(): Promise<void> {
    await this.logEvent('af_initiated_checkout', {
      af_content_type: 'subscription',
    });
  }
}

// Export singleton instance
export const appsFlyerService = new AppsFlyerService();
export default appsFlyerService;
