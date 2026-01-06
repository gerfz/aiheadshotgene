import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from '../constants/config';
import { getAccessToken } from './supabase';
import { CreditsInfo, Generation, GenerationResult } from '../types';

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
 * Get headers for authenticated requests
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
    };
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
  const headers = await getAuthHeaders();
  
  const response = await fetchWithTimeout(`${API_URL}/api/user/credits`, {
    method: 'GET',
    headers,
  }, 10000); // 10 second timeout
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get credits');
  }
  
  return response.json();
}

// Get user's generation history (requires authentication)
export async function getUserGenerations(): Promise<{ generations: Generation[] }> {
  const headers = await getAuthHeaders();
  
  const response = await fetchWithTimeout(`${API_URL}/api/user/generations`, {
    method: 'GET',
    headers,
  }, 10000); // 10 second timeout
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get generations');
  }
  
  return response.json();
}

// =============================================
// UNIFIED ENDPOINTS
// =============================================

// Get credits (authenticated users only)
export async function getCredits(): Promise<CreditsInfo> {
  return getUserCredits();
}

// Get generations (authenticated users only)
export async function getGenerations(): Promise<{ generations: Generation[] }> {
  return getUserGenerations();
}

// Generate portrait (authenticated users only)
export async function generatePortrait(
  imageUri: string,
  styleKey: string,
  customPrompt?: string | null
): Promise<{ success: boolean; generation: GenerationResult; requiresSignup?: boolean }> {
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
  
  return response.json();
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
export async function updateSubscriptionStatus(isSubscribed: boolean): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/subscription`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isSubscribed }),
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
  
  return response.json();
}