import { NativeModules, Platform } from 'react-native';

const { TikTokSDK: NativeTikTokSDK } = NativeModules;

/**
 * TikTok Business SDK wrapper for React Native
 */

interface TikTokConfig {
  appId: string;
  tiktokAppId: string;
  accessToken?: string;
  debugMode?: boolean;
}

interface TikTokEvent {
  eventName: string;
  properties?: Record<string, any>;
}

class TikTokSDK {
  private initialized: boolean = false;

  /**
   * Initialize the TikTok SDK
   * @param config - Configuration object with app credentials
   */
  async initialize(config: TikTokConfig): Promise<void> {
    if (Platform.OS !== 'android') {
      console.warn('TikTok SDK is only available on Android');
      return;
    }

    if (!NativeTikTokSDK) {
      console.error('TikTok SDK native module not found. Make sure to rebuild the app.');
      return;
    }

    try {
      await NativeTikTokSDK.initialize(
        config.appId,
        config.tiktokAppId,
        config.accessToken || '',
        config.debugMode || false
      );
      this.initialized = true;
      console.log('TikTok SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TikTok SDK:', error);
      throw error;
    }
  }

  /**
   * Set test event code for debug mode
   * @param code - Test event code from TikTok dashboard
   */
  async setTestEventCode(code: string): Promise<void> {
    if (Platform.OS !== 'android' || !NativeTikTokSDK) {
      return;
    }

    try {
      await NativeTikTokSDK.setTestEventCode(code);
      console.log('TikTok test event code set:', code);
    } catch (error) {
      console.error('Failed to set test event code:', error);
    }
  }

  /**
   * Track a custom event
   * @param event - Event object with name and properties
   */
  async trackEvent(event: TikTokEvent): Promise<void> {
    if (!this.initialized) {
      console.warn('TikTok SDK not initialized. Call initialize() first.');
      return;
    }

    if (Platform.OS !== 'android' || !NativeTikTokSDK) {
      return;
    }

    try {
      await NativeTikTokSDK.trackEvent(event.eventName, event.properties || {});
      console.log('TikTok event tracked:', event.eventName);
    } catch (error) {
      console.error('Failed to track TikTok event:', error);
    }
  }

  /**
   * Identify user for TikTok tracking
   * @param externalId - User ID
   * @param externalUserName - User name
   * @param phoneNumber - Phone number
   * @param email - Email address
   */
  async identify(
    externalId: string,
    externalUserName: string = '',
    phoneNumber: string = '',
    email: string = ''
  ): Promise<void> {
    if (Platform.OS !== 'android' || !NativeTikTokSDK) {
      return;
    }

    try {
      await NativeTikTokSDK.identify(externalId, externalUserName, phoneNumber, email);
      console.log('TikTok user identified:', externalId);
    } catch (error) {
      console.error('Failed to identify TikTok user:', error);
    }
  }

  /**
   * Track app install event
   * CRITICAL: This must be called on first app launch for proper attribution
   * @param eventId - Unique event ID for deduplication (recommended)
   */
  async trackInstall(eventId?: string): Promise<void> {
    const properties: Record<string, any> = {
      timestamp: Date.now(),
    };
    
    if (eventId) {
      properties.event_id = eventId;
    }
    
    return this.trackEvent({ 
      eventName: 'InstallApp',
      properties 
    });
  }

  /**
   * Track app launch event
   */
  async trackLaunch(): Promise<void> {
    if (Platform.OS !== 'android' || !NativeTikTokSDK) {
      return;
    }

    try {
      await NativeTikTokSDK.trackLaunch();
    } catch (error) {
      console.error('Failed to track launch:', error);
    }
  }

  /**
   * Track login event
   */
  async trackLogin(): Promise<void> {
    if (Platform.OS !== 'android' || !NativeTikTokSDK) {
      return;
    }

    try {
      await NativeTikTokSDK.trackLogin();
    } catch (error) {
      console.error('Failed to track login:', error);
    }
  }

  /**
   * Track registration event
   * @param eventId - Unique event ID for deduplication (recommended)
   */
  async trackRegistration(eventId?: string): Promise<void> {
    if (Platform.OS !== 'android' || !NativeTikTokSDK) {
      return;
    }

    try {
      if (eventId) {
        // If event ID provided, use custom event tracking for better control
        await this.trackEvent({
          eventName: 'Registration',
          properties: {
            event_id: eventId,
            timestamp: Date.now(),
          }
        });
      } else {
        // Use native method
        await NativeTikTokSDK.trackRegistration();
      }
    } catch (error) {
      console.error('Failed to track registration:', error);
    }
  }

  /**
   * Track subscribe event
   */
  async trackSubscribe(): Promise<void> {
    if (Platform.OS !== 'android' || !NativeTikTokSDK) {
      return;
    }

    try {
      await NativeTikTokSDK.trackSubscribe();
    } catch (error) {
      console.error('Failed to track subscribe:', error);
    }
  }

  /**
   * Track purchase event
   * @param value - Purchase value
   * @param currency - Currency code (e.g., 'USD')
   * @param contentType - Type of content purchased
   * @param contentId - ID of the content
   */
  async trackPurchase(
    value: number,
    currency: string = 'USD',
    contentType?: string,
    contentId?: string
  ): Promise<void> {
    return this.trackEvent({
      eventName: 'Purchase',
      properties: {
        value,
        currency,
        content_type: contentType,
        content_id: contentId,
      },
    });
  }


  /**
   * Track content view event
   * @param contentType - Type of content viewed
   * @param contentId - ID of the content
   */
  async trackContentView(contentType: string, contentId: string): Promise<void> {
    return this.trackEvent({
      eventName: 'ViewContent',
      properties: {
        content_type: contentType,
        content_id: contentId,
      },
    });
  }

  /**
   * Track add to cart event
   * @param contentType - Type of content
   * @param contentId - ID of the content
   * @param value - Value of the item
   */
  async trackAddToCart(
    contentType: string,
    contentId: string,
    value?: number
  ): Promise<void> {
    return this.trackEvent({
      eventName: 'AddToCart',
      properties: {
        content_type: contentType,
        content_id: contentId,
        value,
      },
    });
  }

  /**
   * Track checkout event
   * @param value - Total checkout value
   * @param currency - Currency code
   */
  async trackCheckout(value: number, currency: string = 'USD'): Promise<void> {
    return this.trackEvent({
      eventName: 'InitiateCheckout',
      properties: {
        value,
        currency,
      },
    });
  }
}

// Export singleton instance
export const tiktokSDK = new TikTokSDK();
export default tiktokSDK;
