import * as SecureStore from 'expo-secure-store';
import { CreditsInfo, Generation } from '../types';

// Cache keys
const CACHE_KEYS = {
  CREDITS: 'cached_credits',
  GENERATIONS: 'cached_generations',
  LAST_SYNC: 'last_sync_timestamp',
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

