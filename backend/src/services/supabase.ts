import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper functions for database operations
export async function getUserProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  
  // Check if user's email is verified and award credits if needed
  if (data && !data.credits_awarded) {
    await checkAndAwardVerificationCredits(userId);
    // Refetch profile to get updated credits
    const { data: updatedData } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return updatedData || data;
  }
  
  return data;
}

// Check and award credits if email is verified
export async function checkAndAwardVerificationCredits(userId: string) {
  const { data, error } = await supabaseAdmin.rpc('award_verification_credits', {
    user_id: userId
  });
  
  if (error) {
    console.error('Error awarding verification credits:', error);
  }
  
  return data;
}

export async function decrementCredits(userId: string) {
  const { data, error } = await supabaseAdmin.rpc('decrement_credits', {
    user_id: userId
  });
  
  if (error) throw error;
  return data;
}

export async function createGeneration(
  userId: string,
  styleKey: string,
  originalImageUrl: string,
  customPrompt?: string
) {
  const insertData: any = {
    user_id: userId,
    style_key: styleKey,
    original_image_url: originalImageUrl,
    status: 'pending'
  };

  if (customPrompt) {
    insertData.custom_prompt = customPrompt;
  }

  const { data, error } = await supabaseAdmin
    .from('generations')
    .insert(insertData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateGeneration(
  generationId: string,
  updates: { status?: string; generated_image_url?: string }
) {
  const { data, error } = await supabaseAdmin
    .from('generations')
    .update(updates)
    .eq('id', generationId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserGenerations(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function uploadImage(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true
    });
  
  if (error) throw error;
  
  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return urlData.publicUrl;
}

// =============================================
// GUEST USER FUNCTIONS
// =============================================

/**
 * Get or create a guest profile by device ID
 */
export async function getOrCreateGuestProfile(deviceId: string) {
  // Try to get existing profile
  const { data: existing, error: selectError } = await supabaseAdmin
    .from('guest_profiles')
    .select('*')
    .eq('device_id', deviceId)
    .single();
  
  if (existing) {
    return existing;
  }
  
  // Create new guest profile
  const { data, error } = await supabaseAdmin
    .from('guest_profiles')
    .insert({
      device_id: deviceId,
      free_credits: 3
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get guest profile by device ID
 */
export async function getGuestProfile(deviceId: string) {
  const { data, error } = await supabaseAdmin
    .from('guest_profiles')
    .select('*')
    .eq('device_id', deviceId)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Decrement guest credits
 */
export async function decrementGuestCredits(deviceId: string) {
  const { data, error } = await supabaseAdmin.rpc('decrement_guest_credits', {
    p_device_id: deviceId
  });
  
  if (error) throw error;
  return data;
}

/**
 * Create a generation for a guest user
 */
export async function createGuestGeneration(
  deviceId: string,
  styleKey: string,
  originalImageUrl: string,
  customPrompt?: string
) {
  const insertData: any = {
    guest_device_id: deviceId,
    style_key: styleKey,
    original_image_url: originalImageUrl,
    status: 'pending'
  };

  if (customPrompt) {
    insertData.custom_prompt = customPrompt;
  }

  const { data, error } = await supabaseAdmin
    .from('generations')
    .insert(insertData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get generations for a guest user
 */
export async function getGuestGenerations(deviceId: string) {
  const { data, error } = await supabaseAdmin
    .from('generations')
    .select('*')
    .eq('guest_device_id', deviceId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

/**
 * Migrate guest data to a user account
 */
export async function migrateGuestToUser(deviceId: string, userId: string) {
  const { error } = await supabaseAdmin.rpc('migrate_guest_to_user', {
    p_device_id: deviceId,
    p_user_id: userId
  });
  
  if (error) throw error;
  return true;
}

