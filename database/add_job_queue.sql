-- =====================================================
-- JOB QUEUE TABLE FOR ASYNC IMAGE GENERATION
-- Allows backend to accept requests immediately and
-- process them asynchronously
-- =====================================================

-- Create jobs table
CREATE TABLE IF NOT EXISTS generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id uuid NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 2,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Job data
  style_key text NOT NULL,
  custom_prompt text,
  edit_prompt text,
  original_image_url text NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id ON generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_at ON generation_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_generation_id ON generation_jobs(generation_id);

-- Create composite index for fetching next job
CREATE INDEX IF NOT EXISTS idx_generation_jobs_queue 
ON generation_jobs(status, created_at) 
WHERE status = 'queued';

-- Enable Row Level Security
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view own jobs"
ON generation_jobs FOR SELECT
USING (auth.uid() = user_id);

-- Service role can do anything (for backend processing)
CREATE POLICY "Service role full access"
ON generation_jobs FOR ALL
USING (auth.role() = 'service_role');

-- Function to get next job from queue
CREATE OR REPLACE FUNCTION get_next_generation_job()
RETURNS TABLE(
  job_id uuid,
  generation_id uuid,
  user_id uuid,
  style_key text,
  custom_prompt text,
  edit_prompt text,
  original_image_url text
) AS $$
DECLARE
  v_job_id uuid;
BEGIN
  -- Get next queued job and mark as processing atomically
  SELECT id INTO v_job_id
  FROM generation_jobs
  WHERE status = 'queued'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED; -- Skip locked rows to handle concurrent workers
  
  -- If no job found, return empty
  IF v_job_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Update job status to processing
  UPDATE generation_jobs
  SET 
    status = 'processing',
    started_at = now()
  WHERE id = v_job_id;
  
  -- Return job data
  RETURN QUERY
  SELECT 
    j.id,
    j.generation_id,
    j.user_id,
    j.style_key,
    j.custom_prompt,
    j.edit_prompt,
    j.original_image_url
  FROM generation_jobs j
  WHERE j.id = v_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark job as completed
CREATE OR REPLACE FUNCTION complete_generation_job(
  p_job_id uuid,
  p_generated_image_url text
)
RETURNS boolean AS $$
BEGIN
  -- Update job status
  UPDATE generation_jobs
  SET 
    status = 'completed',
    completed_at = now()
  WHERE id = p_job_id;
  
  -- Update generation record
  UPDATE generations
  SET 
    status = 'completed',
    generated_image_url = p_generated_image_url
  WHERE id = (SELECT generation_id FROM generation_jobs WHERE id = p_job_id);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to mark job as failed
CREATE OR REPLACE FUNCTION fail_generation_job(
  p_job_id uuid,
  p_error_message text
)
RETURNS boolean AS $$
DECLARE
  v_retry_count integer;
  v_max_retries integer;
  v_generation_id uuid;
BEGIN
  -- Get current retry info
  SELECT retry_count, max_retries, generation_id
  INTO v_retry_count, v_max_retries, v_generation_id
  FROM generation_jobs
  WHERE id = p_job_id;
  
  -- If can retry, reset to queued
  IF v_retry_count < v_max_retries THEN
    UPDATE generation_jobs
    SET 
      status = 'queued',
      retry_count = v_retry_count + 1,
      error_message = p_error_message,
      started_at = NULL
    WHERE id = p_job_id;
    
    RETURN false; -- Will retry
  ELSE
    -- Max retries reached, mark as failed
    UPDATE generation_jobs
    SET 
      status = 'failed',
      error_message = p_error_message,
      completed_at = now()
    WHERE id = p_job_id;
    
    -- Update generation record
    UPDATE generations
    SET status = 'failed'
    WHERE id = v_generation_id;
    
    RETURN true; -- Permanent failure
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON generation_jobs TO authenticated;
GRANT ALL ON generation_jobs TO service_role;
GRANT EXECUTE ON FUNCTION get_next_generation_job TO service_role;
GRANT EXECUTE ON FUNCTION complete_generation_job TO service_role;
GRANT EXECUTE ON FUNCTION fail_generation_job TO service_role;

-- Add comment
COMMENT ON TABLE generation_jobs IS 'Queue for async image generation jobs';



