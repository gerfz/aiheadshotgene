-- Add batch generation support
-- This allows users to generate multiple styles at once

-- Create generation_batches table
CREATE TABLE IF NOT EXISTS generation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_image_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  total_count INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add batch_id column to generations table
ALTER TABLE generations 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES generation_batches(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_generation_batches_user_id ON generation_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_batches_created_at ON generation_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_batch_id ON generations(batch_id);

-- Enable RLS on generation_batches
ALTER TABLE generation_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own batches
CREATE POLICY "Users can view own batches"
  ON generation_batches
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own batches
CREATE POLICY "Users can insert own batches"
  ON generation_batches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own batches
CREATE POLICY "Users can update own batches"
  ON generation_batches
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update batch status based on generations
CREATE OR REPLACE FUNCTION update_batch_status()
RETURNS TRIGGER AS $$
DECLARE
  batch_total INTEGER;
  batch_completed INTEGER;
  batch_failed INTEGER;
BEGIN
  -- Only process if this generation has a batch_id
  IF NEW.batch_id IS NOT NULL THEN
    -- Count total and completed generations in this batch
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE status = 'completed'),
      COUNT(*) FILTER (WHERE status = 'failed')
    INTO batch_total, batch_completed, batch_failed
    FROM generations
    WHERE batch_id = NEW.batch_id;
    
    -- Update the batch
    UPDATE generation_batches
    SET 
      completed_count = batch_completed,
      status = CASE
        WHEN batch_completed + batch_failed = batch_total THEN 
          CASE WHEN batch_completed > 0 THEN 'completed' ELSE 'failed' END
        WHEN batch_completed > 0 OR batch_failed > 0 THEN 'processing'
        ELSE 'pending'
      END,
      updated_at = NOW()
    WHERE id = NEW.batch_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update batch status when generation status changes
DROP TRIGGER IF EXISTS trigger_update_batch_status ON generations;
CREATE TRIGGER trigger_update_batch_status
  AFTER INSERT OR UPDATE OF status
  ON generations
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_status();

-- View to get batches with their generations
CREATE OR REPLACE VIEW batch_generations_view AS
SELECT 
  b.id as batch_id,
  b.user_id,
  b.original_image_url,
  b.status as batch_status,
  b.total_count,
  b.completed_count,
  b.created_at,
  b.updated_at,
  json_agg(
    json_build_object(
      'id', g.id,
      'style_key', g.style_key,
      'generated_image_url', g.generated_image_url,
      'status', g.status,
      'created_at', g.created_at
    ) ORDER BY g.created_at
  ) FILTER (WHERE g.id IS NOT NULL) as generations
FROM generation_batches b
LEFT JOIN generations g ON g.batch_id = b.id
GROUP BY b.id, b.user_id, b.original_image_url, b.status, b.total_count, b.completed_count, b.created_at, b.updated_at
ORDER BY b.created_at DESC;
