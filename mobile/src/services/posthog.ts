import PostHog from 'posthog-react-native';

// Initialize PostHog
export const posthog = new PostHog(
  'phc_HsMJRuIpEXVZqSEGxLMGF14KS9jzxjN88O5mNvfg57r',
  {
    host: 'https://eu.i.posthog.com',
    captureApplicationLifecycleEvents: true, // Automatically track app open/close
    captureDeepLinks: true,
    enableSessionReplay: false, // Enable if you want session recordings
  }
);

// Track events with type safety
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  posthog.capture(eventName, properties);
};

// Identify user (use anonymous ID or user ID)
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  posthog.identify(userId, properties);
};

// Reset user (on logout)
export const resetUser = () => {
  posthog.reset();
};

// Common events
export const analytics = {
  // App lifecycle
  appOpened: () => trackEvent('app_opened'),
  onboardingCompleted: () => trackEvent('onboarding_completed'),
  
  // Photo upload
  photoUploaded: (source: 'camera' | 'gallery') => 
    trackEvent('photo_uploaded', { source }),
  
  // Style selection
  styleSelected: (styleKey: string, category: string) => 
    trackEvent('style_selected', { style_key: styleKey, category }),
  
  categoryFiltered: (category: string) => 
    trackEvent('category_filtered', { category }),
  
  customPromptUsed: (promptLength: number) => 
    trackEvent('custom_prompt_used', { prompt_length: promptLength }),
  
  // Generation
  generationStarted: (styleKey: string, hasCredits: boolean) => 
    trackEvent('generation_started', { style_key: styleKey, has_credits: hasCredits }),
  
  generationCompleted: (styleKey: string, duration: number) => 
    trackEvent('generation_completed', { style_key: styleKey, duration_seconds: duration }),
  
  generationFailed: (styleKey: string, error: string) => 
    trackEvent('generation_failed', { style_key: styleKey, error }),
  
  // Photo actions
  photoDownloaded: (styleKey: string) => 
    trackEvent('photo_downloaded', { style_key: styleKey }),
  
  photoShared: (styleKey: string) => 
    trackEvent('photo_shared', { style_key: styleKey }),
  
  photoDeleted: (styleKey: string) => 
    trackEvent('photo_deleted', { style_key: styleKey }),
  
  photoEdited: (styleKey: string) => 
    trackEvent('photo_edited', { style_key: styleKey }),
  
  // Monetization
  subscriptionScreenViewed: () => 
    trackEvent('subscription_screen_viewed'),
  
  subscriptionPurchased: (plan: string, price: string) => 
    trackEvent('subscription_purchased', { plan, price }),
  
  subscriptionRestored: () => 
    trackEvent('subscription_restored'),
  
  creditsDepletedBannerShown: () => 
    trackEvent('credits_depleted_banner_shown'),
  
  upgradeNowClicked: (source: 'banner' | 'profile' | 'generation') => 
    trackEvent('upgrade_now_clicked', { source }),
  
  // Profile
  profileViewed: () => 
    trackEvent('profile_viewed'),
  
  emailSet: () => 
    trackEvent('email_set'),
  
  // Navigation
  screenViewed: (screenName: string) => 
    trackEvent('screen_viewed', { screen_name: screenName }),
};

export default posthog;
