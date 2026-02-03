import * as SecureStore from 'expo-secure-store';
import { CreditsInfo, Generation } from '../types';

// Cache keys
const CACHE_KEYS = {
  CREDITS: 'cached_credits',
  GENERATIONS: 'cached_generations',
  LAST_SYNC: 'last_sync_timestamp',
  USER_PROFILE: 'cached_user_profile',
  SUBSCRIPTION_STATUS: 'cached_subscription_status',
};

// Cache expiry time (5 minutes)
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Cache credits data
 */
export async function cacheCredits(credits: CreditsInfo): Promise<void> {
  try {
    await SecureStore.setItemAsync(CACHE_KEYS.CREDITS, JSON.stringify(credits));
    await SecureStore.setItemAsync(CACHE_KEYS.LAST_SYNC, Date.now().toString());
    console.log('💾 Credits cached:', credits);
  } catch (error) {
    console.error('Failed to cache credits:', error);
  }
}

/**
 * Get cached credits
 */
export async function getCachedCredits(): Promise<CreditsInfo | null> {
  try {
    const cached = await SecureStore.getItemAsync(CACHE_KEYS.CREDITS);
    if (!cached) return null;
    
    const credits = JSON.parse(cached) as CreditsInfo;
    console.log('📦 Retrieved cached credits:', credits);
    return credits;
  } catch (error) {
    console.error('Failed to get cached credits:', error);
    return null;
  }
}

/**
 * Cache generations data
 */
export async function cacheGenerations(generations: Generation[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(CACHE_KEYS.GENERATIONS, JSON.stringify(generations));
    console.log('💾 Generations cached:', generations.length, 'items');
  } catch (error) {
    console.error('Failed to cache generations:', error);
  }
}

/**
 * Get cached generations
 */
export async function getCachedGenerations(): Promise<Generation[] | null> {
  try {
    const cached = await SecureStore.getItemAsync(CACHE_KEYS.GENERATIONS);
    if (!cached) return null;
    
    const generations = JSON.parse(cached) as Generation[];
    console.log('📦 Retrieved cached generations:', generations.length, 'items');
    return generations;
  } catch (error) {
    console.error('Failed to get cached generations:', error);
    return null;
  }
}

/**
 * Check if cache is still valid (not expired)
 */
export async function isCacheValid(): Promise<boolean> {
  try {
    const lastSync = await SecureStore.getItemAsync(CACHE_KEYS.LAST_SYNC);
    if (!lastSync) return false;
    
    const timeSinceSync = Date.now() - parseInt(lastSync);
    const isValid = timeSinceSync < CACHE_EXPIRY_MS;
    
    console.log(`🕐 Cache age: ${Math.round(timeSinceSync / 1000)}s, valid: ${isValid}`);
    return isValid;
  } catch (error) {
    console.error('Failed to check cache validity:', error);
    return false;
  }
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(CACHE_KEYS.CREDITS);
    await SecureStore.deleteItemAsync(CACHE_KEYS.GENERATIONS);
    await SecureStore.deleteItemAsync(CACHE_KEYS.LAST_SYNC);
    console.log('🗑️ Cache cleared');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

/**
 * Clear only credits cache (useful when subscription status changes)
 */
export async function clearCreditsCache(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(CACHE_KEYS.CREDITS);
    console.log('🗑️ Credits cache cleared');
  } catch (error) {
    console.error('Failed to clear credits cache:', error);
  }
}

/**
 * Cache user profile data for instant app startup
 */
export async function cacheUserProfile(userId: string, email: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(CACHE_KEYS.USER_PROFILE, JSON.stringify({ userId, email }));
    console.log('💾 User profile cached');
  } catch (error) {
    console.error('Failed to cache user profile:', error);
  }
}

/**
 * Get cached user profile
 */
export async function getCachedUserProfile(): Promise<{ userId: string; email: string } | null> {
  try {
    const cached = await SecureStore.getItemAsync(CACHE_KEYS.USER_PROFILE);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to get cached user profile:', error);
    return null;
  }
}

/**
 * Cache subscription status
 */
export async function cacheSubscriptionStatus(isSubscribed: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(CACHE_KEYS.SUBSCRIPTION_STATUS, JSON.stringify(isSubscribed));
    console.log('💾 Subscription status cached:', isSubscribed);
  } catch (error) {
    console.error('Failed to cache subscription status:', error);
  }
}

/**
 * Get cached subscription status
 */
export async function getCachedSubscriptionStatus(): Promise<boolean | null> {
  try {
    const cached = await SecureStore.getItemAsync(CACHE_KEYS.SUBSCRIPTION_STATUS);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to get cached subscription status:', error);
    return null;
  }
}


