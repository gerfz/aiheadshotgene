import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import generateRoutes from './routes/generate';
import userRoutes from './routes/user';
import { startWorker, getWorkerStatus, triggerWorker } from './workers/generationWorker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Export triggerWorker so routes can use it
export { triggerWorker };

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (req.headers['x-guest-device-id']) {
    console.log(`Guest ID: ${req.headers['x-guest-device-id']}`);
  }
  next();
});

// Health check - ultra-lightweight endpoint for cold start detection
// This endpoint is optimized to respond as fast as possible during cold starts
app.get('/health', (req, res) => {
  // Return minimal response immediately - don't check worker status on cold start
  res.json({ 
    status: 'ready',
    timestamp: Date.now() // Use timestamp instead of ISO string for speed
  });
});

// Detailed health check for monitoring/debugging
app.get('/health/detailed', (req, res) => {
  const workerStatus = getWorkerStatus();
  res.json({ 
    status: 'ready',
    timestamp: new Date().toISOString(),
    worker: workerStatus,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('AI Portrait Studio API is running');
});

// Routes
app.use('/api/generate', generateRoutes);
app.use('/api/user', userRoutes);

// 404 Handler - MUST be after all other routes
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Self-warming mechanism - keeps backend warm by making periodic calls
const WARMUP_DEVICE_ID = '67ef9dc6f662ee57'; // Your device ID
const WARMUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

async function warmupBackend() {
  try {
    console.log('🔥 Running backend warmup...');
    
    const baseUrl = process.env.BACKEND_URL || 'https://aiheadshotgene-1.onrender.com';
    
    // Make the same calls that a real user would make
    const headers = {
      'Content-Type': 'application/json',
      'x-guest-device-id': WARMUP_DEVICE_ID,
    };
    
    // Call 1: Get credits
    await fetch(`${baseUrl}/api/user/credits`, { 
      method: 'GET',
      headers 
    }).catch(err => console.log('Warmup credits call failed:', err.message));
    
    // Call 2: Get generations
    await fetch(`${baseUrl}/api/user/generations`, { 
      method: 'GET',
      headers 
    }).catch(err => console.log('Warmup generations call failed:', err.message));
    
    // Call 3: Sync subscription status
    await fetch(`${baseUrl}/api/user/subscription`, { 
      method: 'POST',
      headers,
      body: JSON.stringify({ isSubscribed: false })
    }).catch(err => console.log('Warmup subscription call failed:', err.message));
    
    console.log('✅ Backend warmup completed');
  } catch (error) {
    console.error('❌ Warmup error:', error);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Start background worker for processing generation jobs
  startWorker();
  
  // Start self-warming mechanism
  console.log('🔥 Starting self-warming mechanism (every 10 minutes)');
  setInterval(warmupBackend, WARMUP_INTERVAL);
  
  // Run initial warmup after 30 seconds (let server fully start first)
  setTimeout(warmupBackend, 30000);
});

export default app;
