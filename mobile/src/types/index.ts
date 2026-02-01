export interface User {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  email: string;
  total_credits: number;
  is_subscribed: boolean;
  is_trial_active: boolean;
  trial_start_date: string | null;
  trial_end_date: string | null;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: string | null;
  guest_device_id: string | null;
  style_key: string;
  original_image_url: string;
  generated_image_url: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  is_edited?: boolean;
}

export interface StylePreset {
  key: string;
  name: string;
  description: string;
  thumbnail: any;
  thumbnails?: any[]; // Multiple thumbnails for swipable carousel
  prompt: string;
  isCustom?: boolean; // Flag for custom style option
  badge?: {
    label: string;
    type: 'female' | 'male' | 'info';
  };
}

export interface GenerationResult {
  id: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  styleKey: string;
  status: string;
}

export interface CreditsInfo {
  totalCredits: number;
  isSubscribed: boolean;
  hasCredits: boolean;
  isTrialActive: boolean;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  canGenerate: boolean;
  canEdit: boolean;
}

