export interface User {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  email: string;
  free_credits: number;
  is_subscribed: boolean;
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
  freeCredits: number;
  isSubscribed: boolean;
  hasCredits: boolean;
}

