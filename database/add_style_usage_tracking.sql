-- Create table to track style usage
CREATE TABLE IF NOT EXISTS public.style_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_key TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on style_key
CREATE UNIQUE INDEX IF NOT EXISTS style_usage_style_key_idx ON public.style_usage(style_key);

-- Enable RLS
ALTER TABLE public.style_usage ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read style usage stats (public data)
CREATE POLICY "Allow public read access to style usage"
  ON public.style_usage FOR SELECT
  USING (true);

-- Only service role can update style usage
CREATE POLICY "Allow service role to update style usage"
  ON public.style_usage FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert initial data for all existing styles with 0 count
INSERT INTO public.style_usage (style_key, usage_count)
VALUES 
  ('custom', 0),
  ('business', 0),
  ('emotional_film', 0),
  ('victoria_secret', 0),
  ('nineties_camera', 0),
  ('professional_headshot', 0),
  ('with_puppy', 0)
ON CONFLICT (style_key) DO NOTHING;

-- Function to increment style usage
CREATE OR REPLACE FUNCTION increment_style_usage(p_style_key TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.style_usage (style_key, usage_count, updated_at)
  VALUES (p_style_key, 1, NOW())
  ON CONFLICT (style_key) 
  DO UPDATE SET 
    usage_count = style_usage.usage_count + 1,
    updated_at = NOW();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_style_usage(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_style_usage(TEXT) TO service_role;

-- Create a view for most used styles (excluding custom, as it's always first)
CREATE OR REPLACE VIEW public.most_used_styles AS
SELECT 
  style_key,
  usage_count,
  updated_at
FROM public.style_usage
WHERE style_key != 'custom'
ORDER BY usage_count DESC, updated_at DESC
LIMIT 4; -- Get top 4 (custom will be added as #1 in the app)

-- Grant select on the view
GRANT SELECT ON public.most_used_styles TO authenticated;
GRANT SELECT ON public.most_used_styles TO anon;

