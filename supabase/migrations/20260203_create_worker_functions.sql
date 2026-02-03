-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_next_generation_job();

-- Create function to fetch next job from queue
CREATE OR REPLACE FUNCTION get_next_generation_job()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  generation_id uuid,
  status text,
  style_key text,
  custom_prompt text,
  original_image_url text,
  created_at timestamptz,
  updated_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  retry_count integer
) AS $$
BEGIN
  RETURN QUERY
  UPDATE generation_jobs gj
  SET 
    status = 'processing',
    started_at = NOW(),
    updated_at = NOW()
  WHERE gj.id = (
    SELECT gj2.id
    FROM generation_jobs gj2
    WHERE gj2.status = 'queued'
    ORDER BY gj2.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    gj.id,
    gj.user_id,
    gj.generation_id,
    gj.status,
    gj.style_key,
    gj.custom_prompt,
    gj.original_image_url,
    gj.created_at,
    gj.updated_at,
    gj.started_at,
    gj.completed_at,
    gj.error_message,
    gj.retry_count;
END;
$$ LANGUAGE plpgsql;
