import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from '../constants/config';
import { getAccessToken } from './supabase';
import { CreditsInfo, Generation, GenerationResult } from '../types';

/**
 * Check if backend is ready (warm) by making a lightweight API call
 * This prevents making real API calls while backend is cold starting
 * 
 * NOTE: We removed the /health endpoint, so we just use a simple delay
 * to give the backend time to wake up from cold start
 */
export async function waitForBackendReady(
  maxWaitMs: number = 30000,
  onProgress?: (progress: number, attempt: number) => void
): Promise<boolean> {
  console.log('🔍 Waiting for backend to be ready...');
  
  // Simple progressive wait to give backend time to wake up
  // Most Render cold starts complete within 10-20 seconds
  const steps = 10;
  const stepDelay = Math.min(maxWaitMs / steps, 2000); // Max 2s per step
  
  for (let i = 0; i < steps; i++) {
    const progress = ((i + 1) / steps) * 90; // 0-90%
    onProgress?.(progress, i + 1);
    
    if (i < steps - 1) { // Don't wait after last step
      await new Promise(resolve => setTimeout(resolve, stepDelay));
    }
  }
  
  console.log('✅ Backend warmup wait complete');
  onProgress?.(90, steps);
  return true;
}

/**
 * Helper to add timeout to fetch requests
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - backend might be waking up. Please try again.');
    }
    throw error;
  }
}

/**
 * Retry wrapper for API calls with exponential backoff
 * Distinguishes between real failures (401, 404) and transient errors (timeout, 5xx)
 */
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelays?: number[];
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const { 
    maxRetries = 3, 
    retryDelays = [1000, 2000, 3000], // 1s, 2s, 3s
    shouldRetry = (error: any) => {
      // Don't retry on auth errors or not found
      if (error?.status === 401 || error?.status === 404) {
        return false;
      }
      // Retry on timeouts, 5xx errors, network errors
      return true;
    }
  } = options;
  
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if we shouldn't
      if (!shouldRetry(error)) {
        console.log(`❌ Non-retryable error: ${error.message}`);
        throw error;
      }
      
      // If this was the last attempt, throw
      if (attempt === maxRetries - 1) {
        console.log(`❌ All ${maxRetries} retry attempts exhausted`);
        throw error;
      }
      
      // Wait before retrying
      const delay = retryDelays[attempt] || retryDelays[retryDelays.length - 1];
      console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Get headers for authenticated requests
 * Retries up to 3 times with delays to wait for auth session to be restored
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 3000]; // 1s, 2s, 3s
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const token = await getAccessToken();
      if (token) {
        return {
          'Authorization': `Bearer ${token}`,
        };
      }
      
      // No token yet - session might still be restoring
      if (attempt < MAX_RETRIES) {
        console.warn(`⚠️ No auth token (attempt ${attempt + 1}/${MAX_RETRIES + 1}) - waiting for session...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
      } else {
        console.error('❌ No auth token after all retries - user session not available');
        return {};
      }
    } catch (error: any) {
      if (attempt < MAX_RETRIES) {
        console.warn(`⚠️ Auth token error (attempt ${attempt + 1}): ${error.message} - retrying...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
      } else {
        console.error('❌ Failed to get auth token after all retries:', error.message);
        return {};
      }
    }
  }
  
  return {};
}

/**
 * Get appropriate headers based on auth state
 */
async function getHeaders(): Promise<Record<string, string>> {
  return getAuthHeaders();
}

// =============================================
// PUBLIC ENDPOINTS
// =============================================

// Get most used styles (no auth required)
export async function getMostUsedStyles(): Promise<{ mostUsedStyles: Array<{ style_key: string; usage_count: number }> }> {
  const response = await fetch(`${API_URL}/api/generate/most-used-styles`, {
    method: 'GET',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get most used styles');
  }
  
  return response.json();
}

// =============================================
// AUTHENTICATED USER ENDPOINTS
// =============================================

// Get user credits (requires authentication)
export async function getUserCredits(): Promise<CreditsInfo> {
  return fetchWithRetry(async () => {
    const headers = await getAuthHeaders();
    
    const response = await fetchWithTimeout(`${API_URL}/api/user/credits`, {
      method: 'GET',
      headers,
    }, 15000); // 15 second timeout (increased for cold starts)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get credits' }));
      const err: any = new Error(error.message || 'Failed to get credits');
      err.status = response.status;
      throw err;
    }
    
    return response.json();
  });
}

// Get user's generation history (requires authentication)
export async function getUserGenerations(): Promise<{ generations: Generation[] }> {
  return fetchWithRetry(async () => {
    const headers = await getAuthHeaders();
    
    const response = await fetchWithTimeout(`${API_URL}/api/user/generations`, {
      method: 'GET',
      headers,
    }, 15000); // 15 second timeout (increased for cold starts)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get generations' }));
      const err: any = new Error(error.message || 'Failed to get generations');
      err.status = response.status;
      throw err;
    }
    
    return response.json();
  });
}

// =============================================
// UNIFIED ENDPOINTS
// =============================================

// Get credits (authenticated users only)
export async function getCredits(): Promise<CreditsInfo> {
  return getUserCredits();
}

// Award credits for rating the app
export async function awardRatingCredits(): Promise<{ success: boolean; totalCredits: number }> {
  const headers = await getHeaders();
  
  const response = await fetch(`${API_URL}/api/user/rate-reward`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to award rating credits');
  }

  return response.json();
}

// Purchase credit pack
export async function purchaseCredits(packId: string, credits: number, transactionId: string): Promise<{ success: boolean; totalCredits: number }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/credits/purchase`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ packId, credits, transactionId }),
  });

  if (!response.ok) {
    throw new Error('Failed to purchase credits');
  }

  return response.json();
}

// Start trial for user
export async function startTrial(): Promise<{ success: boolean; trialEndsAt: string }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/trial/start`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to start trial');
  }

  return response.json();
}

// Get generations (authenticated users only)
export async function getGenerations(): Promise<{ generations: Generation[] }> {
  return getUserGenerations();
}

// Get user batches
export async function getBatches(): Promise<{ batches: GenerationBatch[] }> {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/api/user/batches`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch batches');
    }
    
    return response.json();
  } catch (error: any) {
    console.error('Error fetching batches:', error);
    throw error;
  }
}

// Delete a batch
export async function deleteBatch(batchId: string): Promise<{ success: boolean }> {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/api/user/batches/${batchId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete batch');
    }
    
    return response.json();
  } catch (error: any) {
    console.error('Error deleting batch:', error);
    throw error;
  }
}

// Batch generate portraits (multiple styles at once)
export async function generateBatchPortraits(
  imageUri: string,
  styleKeys: string[],
  customPrompt?: string | null
): Promise<{ success: boolean; batchId: string; totalCount: number; remainingCredits: number }> {
  try {
    const headers = await getHeaders();
    
    // Create form data
    const formData = new FormData();
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('Image file not found');
    }
    
    // Determine file type
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';
    
    // Append file
    formData.append('image', {
      uri: imageUri,
      name: `photo.${fileType}`,
      type: mimeType,
    } as any);
    
    // Append style keys as JSON string
    formData.append('styleKeys', JSON.stringify(styleKeys));
    
    // Add custom prompt if provided (for custom style)
    if (customPrompt && styleKeys.includes('custom')) {
      console.log('Adding customPrompt to batch request:', customPrompt);
      formData.append('customPrompt', customPrompt);
    }
    
    const response = await fetch(`${API_URL}/api/generate/batch`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to generate batch' }));
      throw new Error(error.message || error.error || 'Failed to generate batch');
    }
    
    return response.json();
  } catch (error: any) {
    console.error('Batch generation error:', error);
    throw error;
  }
}

// Generate portrait (authenticated users only)
export async function generatePortrait(
  imageUri: string,
  styleKey: string,
  customPrompt?: string | null
): Promise<{ success: boolean; generation: GenerationResult; requiresSignup?: boolean }> {
  try {
    const headers = await getHeaders();
    
    // Create form data
    const formData = new FormData();
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('Image file not found');
    }
    
    // Determine file type
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';
    
    // Append file
    formData.append('image', {
      uri: imageUri,
      name: `photo.${fileType}`,
      type: mimeType,
    } as any);
    
    formData.append('styleKey', styleKey);
    
    // Add custom prompt if provided
    if (customPrompt) {
      console.log('Adding customPrompt to request:', customPrompt);
      formData.append('customPrompt', customPrompt);
    } else {
      console.log('No customPrompt provided for styleKey:', styleKey);
    }
    
    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`API Error (${response.status}):`, text);
      try {
        const error = JSON.parse(text);
        // Check if this is a "no credits" error that requires signup
        if (error.requiresSignup) {
          throw { message: error.message, requiresSignup: true };
        }
        throw new Error(error.message || 'Generation failed');
      } catch (e: any) {
         if (e.requiresSignup) throw e;
         throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}`);
      }
    }
    
    const result = await response.json();
    
    // If status is 202 (job queued), poll for completion
    if (response.status === 202 || result.generation?.status === 'queued') {
      const generationId = result.generation.id;
      console.log(`📋 Job queued, polling for completion: ${generationId}`);
      
      // Poll for completion
      return pollGenerationStatus(generationId);
    }
    
    return result;
  } catch (error: any) {
    // Handle network errors specifically
    if (error.message === 'Network request failed' || error.message?.includes('fetch')) {
      console.error('❌ Network error during generation:', error);
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    }
    // Re-throw other errors as-is
    throw error;
  }
}

// Poll generation status until complete
async function pollGenerationStatus(generationId: string, maxAttempts: number = 60): Promise<{ success: boolean; generation: any }> {
  const headers = await getHeaders();
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const response = await fetch(`${API_URL}/api/generate/${generationId}/status`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to check generation status');
      }
      
      const data = await response.json();
      const status = data.generation?.status;
      const errorMessage = data.generation?.errorMessage;
      
      console.log(`📊 Generation status (attempt ${attempts}): ${status}`);
      
      if (status === 'completed') {
        return {
          success: true,
          generation: data.generation
        };
      } else if (status === 'failed') {
        // Use the error message from the backend if available
        const error = errorMessage || 'Generation failed';
        throw new Error(error);
      }
      
      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (pollError: any) {
      console.error('Polling error:', pollError);
      
      // If this is a content violation or generation failed error, throw immediately
      if (pollError.message && (
        pollError.message.includes('CONTENT_POLICY_VIOLATION') ||
        pollError.message.includes('Generation failed') ||
        pollError.message.includes('flagged as sensitive')
      )) {
        throw pollError; // Re-throw immediately, don't continue polling
      }
      
      // For network errors, check if we've exceeded max attempts
      if (attempts >= maxAttempts) {
        throw new Error('Generation timed out. Please check your gallery later.');
      }
      
      // Wait before retrying (only for network/API errors)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('Generation timed out after 2 minutes');
}

// Check generation status
export async function getGenerationStatus(generationId: string): Promise<{ generation: Generation }> {
  const headers = await getHeaders();
  
  const response = await fetch(`${API_URL}/api/generate/${generationId}/status`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get status');
  }
  
  return response.json();
}

// Get available styles
export async function getAvailableStyles() {
  const response = await fetch(`${API_URL}/api/generate/styles`, {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error('Failed to get styles');
  }
  
  return response.json();
}

// Delete generation
export async function deleteGeneration(generationId: string): Promise<{ success: boolean }> {
  const headers = await getHeaders();
  
  const response = await fetch(`${API_URL}/api/generate/${generationId}`, {
    method: 'DELETE',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete generation');
  }
  
  return response.json();
}

// Update subscription status in backend
export async function updateSubscriptionStatus(
  isSubscribed: boolean, 
  isRenewal: boolean = false,
  isTrialConversion: boolean = false
): Promise<{ success: boolean; totalCredits?: number; creditsAdded?: number }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/subscription`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isSubscribed, isRenewal, isTrialConversion }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update subscription status');
  }
  
  return response.json();
}

// Edit portrait - refine an existing generated portrait
export async function editPortrait(
  imageUrl: string,
  editPrompt: string,
  originalStyleKey?: string
): Promise<{ success: boolean; generation: GenerationResult }> {
  const headers = await getHeaders();
  
  // Download the image from URL to get it as a file
  const localUri = FileSystem.documentDirectory + `edit_${Date.now()}.jpg`;
  await FileSystem.downloadAsync(imageUrl, localUri);
  
  // Create form data
  const formData = new FormData();
  
  // Append the downloaded image
  formData.append('image', {
    uri: localUri,
    name: 'edit_photo.jpg',
    type: 'image/jpeg',
  } as any);
  
  // Use 'edit' as a special style key
  formData.append('styleKey', 'edit');
  
  // Add the edit prompt
  formData.append('editPrompt', editPrompt);
  
  // Add original style key so backend can save it correctly
  if (originalStyleKey) {
    formData.append('originalStyleKey', originalStyleKey);
  }
  
  const response = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });
  
  // Clean up the temporary file
  try {
    await FileSystem.deleteAsync(localUri, { idempotent: true });
  } catch (e) {
    console.warn('Failed to delete temp file:', e);
  }
  
  if (!response.ok) {
    const text = await response.text();
    console.error(`API Error (${response.status}):`, text);
    try {
      const error = JSON.parse(text);
      throw new Error(error.message || 'Edit failed');
    } catch (e: any) {
       throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}`);
    }
  }
  
  const result = await response.json();
  
  // If status is 202 (job queued), poll for completion
  if (response.status === 202 || result.generation?.status === 'queued') {
    const generationId = result.generation.id;
    console.log(`📋 Edit job queued, polling for completion: ${generationId}`);
    
    // Poll for completion
    return pollGenerationStatus(generationId);
  }
  
  return result;
}