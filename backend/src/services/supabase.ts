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
}

// Increment style usage count
export async function incrementStyleUsage(styleKey: string) {
  const { error } = await supabaseAdmin.rpc('increment_style_usage', {
    p_style_key: styleKey
  });
  
  if (error) {
    console.error('Error incrementing style usage:', error);
  }
}

// Get most used styles
export async function getMostUsedStyles() {
  const { data, error } = await supabaseAdmin
    .from('most_used_styles')
    .select('*');
  
  if (error) {
    console.error('Error fetching most used styles:', error);
    return [];
  }
  
  return data || [];
}

export async function decrementCredits(userId: string) {
  // Get the user's profile to find their device_id
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('device_id, free_credits')
    .eq('id', userId)
    .single();
  
  const newCredits = Math.max(0, (profile?.free_credits || 0) - 1);
  
  // Update this user's credits
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ free_credits: newCredits })
    .eq('id', userId);
  
  if (error) throw error;
  
  // If user has a device_id, sync credits to all other profiles with same device_id
  if (profile?.device_id) {
    await supabaseAdmin
      .from('profiles')
      .update({ free_credits: newCredits })
      .eq('device_id', profile.device_id)
      .neq('id', userId);
    
    console.log(`✅ Synced ${newCredits} credits to all profiles with device_id: ${profile.device_id}`);
  }
  
  return { free_credits: newCredits };
}

export async function createGeneration(
  userId: string,
  styleKey: string,
  originalImageUrl: string,
  customPrompt?: string,
  isEdited: boolean = false
) {
  const insertData: any = {
    user_id: userId,
    style_key: styleKey,
    original_image_url: originalImageUrl,
    status: 'pending',
    is_edited: isEdited
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
  // First, get the user's device_id
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('device_id')
    .eq('id', userId)
    .single();
  
  // If user has a device_id, get generations from ALL users with same device_id
  if (profile?.device_id) {
    // Get all user IDs with the same device_id
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('device_id', profile.device_id);
    
    if (profiles && profiles.length > 0) {
      const userIds = profiles.map(p => p.id);
      
      // Get generations from all these users
      const { data, error } = await supabaseAdmin
        .from('generations')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log(`✅ Fetched ${data?.length || 0} generations for device_id: ${profile.device_id}`);
      return data || [];
    }
  }
  
  // Fallback: just get this user's generations
  const { data, error } = await supabaseAdmin
    .from('generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
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
  
  // Create new guest profile with upsert to handle race conditions
  const { data, error } = await supabaseAdmin
    .from('guest_profiles')
    .upsert({
      device_id: deviceId,
      free_credits: 3
    }, {
      onConflict: 'device_id',
      ignoreDuplicates: false
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

