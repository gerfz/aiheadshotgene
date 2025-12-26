-- Add is_edited column to generations table to track edited portraits

ALTER TABLE public.generations
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- Update existing records: mark as edited if they have an edit-related custom_prompt
-- (This is a one-time update for any existing data)
UPDATE public.generations
SET is_edited = TRUE
WHERE custom_prompt LIKE 'Keep the person''s face EXACTLY the same%';

-- Grant necessary permissions
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

