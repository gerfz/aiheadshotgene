import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from '../constants/config';
import { getAccessToken } from './supabase';
import { getGuestId } from './guestStorage';
import { CreditsInfo, Generation, GenerationResult } from '../types';

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
 * Get headers for guest requests
 */
async function getGuestHeaders(): Promise<Record<string, string>> {
  const guestId = await getGuestId();
  if (guestId) {
    return {
      'X-Guest-Device-Id': guestId,
    };
  }
  return {};
}

/**
 * Get appropriate headers based on auth state
 * Prefers auth token over guest ID
 */
async function getHeaders(): Promise<Record<string, string>> {
  const authHeaders = await getAuthHeaders();
  if (authHeaders['Authorization']) {
    return authHeaders;
  }
  return getGuestHeaders();
}

// =============================================
// AUTHENTICATED USER ENDPOINTS
// =============================================

// Get user credits (requires authentication)
export async function getUserCredits(): Promise<CreditsInfo> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/credits`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get credits');
  }
  
  return response.json();
}

// Get user's generation history (requires authentication)
export async function getUserGenerations(): Promise<{ generations: Generation[] }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/generations`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get generations');
  }
  
  return response.json();
}

// Migrate guest data to user account (after signup)
export async function migrateGuestData(guestDeviceId: string): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_URL}/api/user/migrate-guest`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ guestDeviceId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to migrate guest data');
  }
  
  return response.json();
}

// =============================================
// GUEST USER ENDPOINTS
// =============================================

// Get guest credits
export async function getGuestCredits(): Promise<CreditsInfo & { isGuest: boolean }> {
  const headers = await getGuestHeaders();
  
  const response = await fetch(`${API_URL}/api/user/guest/credits`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get guest credits');
  }
  
  return response.json();
}

// Get guest's generation history
export async function getGuestGenerations(): Promise<{ generations: Generation[] }> {
  const headers = await getGuestHeaders();
  
  const response = await fetch(`${API_URL}/api/user/guest/generations`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get guest generations');
  }
  
  return response.json();
}

// =============================================
// UNIFIED ENDPOINTS (WORK FOR BOTH)
// =============================================

// Get credits (works for both authenticated users and guests)
export async function getCredits(): Promise<CreditsInfo> {
  const authHeaders = await getAuthHeaders();
  
  // If authenticated, use user credits endpoint
  if (authHeaders['Authorization']) {
    return getUserCredits();
  }
  
  // Otherwise, use guest credits endpoint
  return getGuestCredits();
}

// Get generations (works for both authenticated users and guests)
export async function getGenerations(): Promise<{ generations: Generation[] }> {
  const authHeaders = await getAuthHeaders();
  
  // If authenticated, use user generations endpoint
  if (authHeaders['Authorization']) {
    return getUserGenerations();
  }
  
  // Otherwise, use guest generations endpoint
  return getGuestGenerations();
}

// Generate portrait (works for both authenticated users and guests)
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
