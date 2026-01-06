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
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .rpc('get_next_generation_job');

    if (fetchError) {
      console.error('❌ Failed to fetch next job:', fetchError);
      return false;
    }

    if (!jobs || jobs.length === 0) {
      // No jobs in queue (this is normal, don't log every time)
      return false;
    }

    const job = jobs[0];
    console.log(`🔄 Processing job ${job.job_id} for generation ${job.generation_id}`);

    // Update generation status to processing
    await supabaseAdmin
      .from('generations')
      .update({ status: 'processing' })
      .eq('id', job.generation_id);

    try {
      // Download original image from Supabase Storage
      const imageUrl = job.original_image_url;
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const imageBase64 = imageBuffer.toString('base64');
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

      // Generate portrait
      console.log(`🎨 Generating portrait with style: ${job.style_key}`);
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

      console.log(`✅ Job ${job.job_id} completed successfully`);
      return true;

    } catch (genError: any) {
      console.error(`❌ Generation failed for job ${job.job_id}:`, genError.message);

      // Mark job as failed (will retry if retries remaining)
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
 * Polls the queue every 2 seconds for new jobs
 */
export function startWorker() {
  if (workerInterval) {
    console.log('⚠️ Worker already running');
    return;
  }

  console.log('🚀 Starting generation worker...');

  // Process jobs every 2 seconds
  workerInterval = setInterval(async () => {
    const processed = await processNextJob();
    if (processed) {
      // If we processed a job, immediately check for another
      // (don't wait for the full interval)
      setTimeout(() => processNextJob(), 100);
    }
  }, 2000);

  // Process first job immediately
  processNextJob();

  console.log('✅ Generation worker started');
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

