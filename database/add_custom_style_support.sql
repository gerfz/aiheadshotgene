-- SQL commands to add custom style support to the database
-- Run these commands in your Supabase SQL Editor

-- Add a column to store custom prompts in the generations table
ALTER TABLE public.generations
ADD COLUMN IF NOT EXISTS custom_prompt TEXT;

-- Add a comment to explain the column
COMMENT ON COLUMN public.generations.custom_prompt IS 'Custom user-provided prompt for style_key = custom';

-- Optional: Create an index for faster queries on custom generations
CREATE INDEX IF NOT EXISTS idx_generations_custom_style 
ON public.generations(style_key) 
WHERE style_key = 'custom';

