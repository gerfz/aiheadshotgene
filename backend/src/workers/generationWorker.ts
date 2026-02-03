import { generatePortrait } from '../services/nanoBanana';
import { supabaseAdmin } from '../services/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Background worker that processes image generation jobs from the queue
 * Runs continuously and picks up jobs as they arrive
 */

let isProcessing = false;
let workerInterval: NodeJS.Timeout | null = null;

async function uploadImage(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true,
    });
  
  if (error) throw error;
  
  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return urlData.publicUrl;
}

async function processNextJob(): Promise<boolean> {
  if (isProcessing) {
    console.log('⏸️ Worker already processing a job, skipping...');
    return false; // Already processing a job
  }

  try {
    isProcessing = true;

    // Get next job from queue
    console.log('🔍 [WORKER] Checking for queued jobs...');
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .rpc('get_next_generation_job');

    if (fetchError) {
      console.error('❌ Failed to fetch next job:', fetchError);
      return false;
    }

    if (!jobs || jobs.length === 0) {
      console.log('⏸️ [WORKER] No jobs in queue');
      return false;
    }

    console.log(`📋 [WORKER] Found ${jobs.length} job(s), processing first one...`);

    const job = jobs[0];
    const userIdShort = job.user_id ? job.user_id.slice(0, 8) : 'unknown';
    console.log(`🔄 [WORKER START] User: ${userIdShort}... | Job: ${job.job_id} | Gen: ${job.generation_id} | Style: ${job.style_key}`);

    // Update generation status to processing
    await supabaseAdmin
      .from('generations')
      .update({ status: 'processing' })
      .eq('id', job.generation_id);

    try {
      // Download original image from Supabase Storage
      const imageUrl = job.original_image_url;
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
      }
      
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const imageBase64 = imageBuffer.toString('base64');
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

      console.log(`📥 [IMAGE DOWNLOADED] User: ${userIdShort}... | Size: ${imageBuffer.length} bytes`);

      // Generate portrait
      console.log(`🎨 [AI GENERATION] User: ${userIdShort}... | Style: ${job.style_key}`);
      const generatedImageBase64 = await generatePortrait(
        imageBase64,
        job.style_key,
        mimeType,
        job.custom_prompt,
        job.edit_prompt
      );

      // Upload generated image
      const generatedFileName = `${job.user_id}/${uuidv4()}-generated.jpg`;
      const generatedBuffer = Buffer.from(generatedImageBase64, 'base64');
      const generatedImageUrl = await uploadImage(
        'portraits',
        generatedFileName,
        generatedBuffer,
        'image/jpeg'
      );

      // Mark job as completed
      await supabaseAdmin.rpc('complete_generation_job', {
        p_job_id: job.job_id,
        p_generated_image_url: generatedImageUrl
      });

      console.log(`✅ [JOB COMPLETED] User: ${userIdShort}... | Job: ${job.job_id} | Generated URL: ${generatedImageUrl.slice(0, 50)}...`);
      return true;

    } catch (genError: any) {
      console.log(`❌ [JOB FAILED] User: ${userIdShort}... | Job: ${job.job_id} | Error: ${genError.message}`);

      // Check if this is a content policy violation - these should NOT be retried
      const isContentViolation = genError.message && (
        genError.message.includes('CONTENT_POLICY_VIOLATION') ||
        genError.message.includes('E005') ||
        genError.message.includes('flagged as sensitive')
      );

      if (isContentViolation) {
        console.log(`🚫 [CONTENT VIOLATION] User: ${userIdShort}... | Job: ${job.job_id} | No retries - permanent failure`);
        
        // Mark job as permanently failed
        await supabaseAdmin
          .from('generation_jobs')
          .update({
            status: 'failed',
            error_message: genError.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.job_id);
        
        // Update generation record to failed
        await supabaseAdmin
          .from('generations')
          .update({ status: 'failed' })
          .eq('id', job.generation_id);
        
        return false;
      }

      // For other errors, use the retry logic
      console.log(`🔄 [RETRY QUEUED] User: ${userIdShort}... | Job: ${job.job_id} | Will retry after backoff`);
      
      await supabaseAdmin.rpc('fail_generation_job', {
        p_job_id: job.job_id,
        p_error_message: genError.message || 'Generation failed'
      });

      return false;
    }

  } catch (error: any) {
    console.error('❌ Worker error:', error);
    return false;
  } finally {
    isProcessing = false;
  }
}

/**
 * Start the worker
 * Polls the queue every 5 seconds for new jobs (reduced from 2s to save DB calls)
 */
export function startWorker() {
  if (workerInterval) {
    console.log('⚠️ Worker already running');
    return;
  }

  console.log('🚀 Starting generation worker...');

  // Process jobs every 5 seconds (when idle)
  workerInterval = setInterval(async () => {
    const processed = await processNextJob();
    if (processed) {
      // If we processed a job, immediately check for another
      // This ensures we process jobs back-to-back without delay
      setTimeout(() => processNextJob(), 500);
    }
  }, 5000);

  // Process first job immediately
  processNextJob();

  console.log('✅ Generation worker started (polling every 5s when idle)');
}

/**
 * Stop the worker
 */
export function stopWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('🛑 Generation worker stopped');
  }
}

/**
 * Get worker status
 */
export function getWorkerStatus() {
  return {
    running: workerInterval !== null,
    processing: isProcessing
  };
}

/**
 * Manually trigger worker to check for jobs immediately
 * Call this after creating a new job to avoid waiting for the interval
 */
export function triggerWorker() {
  if (!isProcessing && workerInterval) {
    console.log('⚡ Manually triggering worker to check for jobs...');
    processNextJob();
  }
}

