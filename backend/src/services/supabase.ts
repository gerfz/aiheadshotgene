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

// Get most used styles (ordered by usage_count descending)
export async function getMostUsedStyles() {
  const { data, error } = await supabaseAdmin
    .from('style_usage')
    .select('style_key, usage_count')
    .order('usage_count', { ascending: false });
  
  if (error) {
    console.error('Error fetching most used styles:', error);
    return [];
  }
  
  return data || [];
}

export async function decrementCredits(userId: string) {
  // Use atomic Postgres function to prevent race conditions
  const { data, error } = await supabaseAdmin
    .rpc('decrement_user_credits', { p_user_id: userId });
  
  if (error) {
    console.error('❌ Failed to decrement credits:', error);
    throw error;
  }
  
  // The function returns: { success: boolean, free_credits: number, message: string }
  const result = data?.[0];
  
  if (!result?.success) {
    throw new Error(result?.message || 'Failed to decrement credits');
  }
  
  console.log(`✅ Credits decremented atomically: ${result.free_credits} remaining`);
  
  return { free_credits: result.free_credits };
}

export async function createGeneration(
  userId: string,
  styleKey: string,
  originalImageUrl: string,
  customPrompt?: string,
  isEdited: boolean = false,
  batchId?: string | null
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

  if (batchId) {
    insertData.batch_id = batchId;
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


