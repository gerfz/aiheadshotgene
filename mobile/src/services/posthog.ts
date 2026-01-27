import PostHog from 'posthog-react-native';

/**
 * PostHog Analytics Service
 * 
 * IMPORTANT: PostHog is initialized LAZILY (on first use) instead of on import
 * This ensures TikTok SDK can capture Install Referrer data first for proper attribution
 */

let posthog: PostHog | null = null;
let isInitializing = false;

// Lazy initialization - only creates PostHog instance when first needed
const getPostHog = (): PostHog => {
  if (posthog) {
    return posthog;
  }

  if (!isInitializing) {
    isInitializing = true;
    console.log('📊 PostHog: Lazy initializing...');
    
    posthog = new PostHog(
      'phc_HsMJRuIpEXVZqSEGxLMGF14KS9jzxjN88O5mNvfg57r',
      {
        host: 'https://eu.i.posthog.com',
        captureApplicationLifecycleEvents: false, // ⚠️ DISABLED - TikTok needs to capture this first
        captureDeepLinks: false, // ⚠️ DISABLED - TikTok needs to capture attribution data first
        enableSessionReplay: false,
      }
    );
    
    console.log('✅ PostHog: Initialized (after TikTok SDK)');
  }

  // Return placeholder until initialization completes
  return posthog || ({
    capture: () => {},
    identify: () => {},
    reset: () => {},
  } as any);
};

// Track events with type safety
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  getPostHog().capture(eventName, properties);
};

// Identify user (use anonymous ID or user ID)
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  getPostHog().identify(userId, properties);
};

// Reset user (on logout)
export const resetUser = () => {
  getPostHog().reset();
};

// Export getter for direct access (if needed)
export { getPostHog as posthog };

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
  
  generationFailed: (styleKey: string, error: string, errorContext?: { 
    noCredits?: boolean, 
    contentViolation?: boolean, 
    networkError?: boolean, 
    timeout?: boolean 
  }) => 
    trackEvent('generation_failed', { 
      style_key: styleKey, 
      error,
      error_type: errorContext?.noCredits ? 'no_credits' : 
                  errorContext?.contentViolation ? 'content_violation' :
                  errorContext?.networkError ? 'network_error' :
                  errorContext?.timeout ? 'timeout' : 'unknown',
      ...errorContext
    }),
  
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
  
  // App rating (after 2 generations)
  rateUsModalShown: (generationCount: number) => 
    trackEvent('rate_us_modal_shown', { generation_count: generationCount }),
  
  rateUsModalClosed: (didRate: boolean) => 
    trackEvent('rate_us_modal_closed', { did_rate: didRate }),
  
  starRatingSelected: (stars: number, willOpenPlayStore: boolean) => 
    trackEvent('star_rating_selected', { 
      stars, 
      will_open_play_store: willOpenPlayStore,
      rating_category: stars >= 4 ? 'positive' : 'negative'
    }),
  
  creditsAwardedForRating: (stars: number, creditsAwarded: number) => 
    trackEvent('credits_awarded_for_rating', { stars, credits_awarded: creditsAwarded }),
  
  // No Credits Modal (when user tries to create without credits)
  noCreditsModalShown: (hasAlreadyRated: boolean, source: 'create_button' | 'upload' | 'generation') => 
    trackEvent('no_credits_modal_shown', { 
      has_already_rated: hasAlreadyRated,
      source,
      options_available: hasAlreadyRated ? 'subscribe_only' : 'rate_and_subscribe'
    }),
  
  noCreditsModalClosed: (action: 'dismissed' | 'rate_us' | 'subscribe', hasAlreadyRated: boolean) => 
    trackEvent('no_credits_modal_closed', { 
      action,
      has_already_rated: hasAlreadyRated 
    }),
  
  noCreditsRateUsClicked: () => 
    trackEvent('no_credits_rate_us_clicked'),
  
  noCreditsSubscribeClicked: (hasAlreadyRated: boolean) => 
    trackEvent('no_credits_subscribe_clicked', { 
      has_already_rated: hasAlreadyRated,
      user_type: hasAlreadyRated ? 'previously_rated' : 'new_rater'
    }),
  
  // Feedback
  feedbackRequested: (source: string) => 
    trackEvent('feedback_requested', { source }),
  
  feedbackSubmitted: (feedback: string, source: string) => 
    trackEvent('feedback_submitted', { feedback, source }),
  
  // Generic event for custom tracking
  trackEvent,
};

export default posthog;
