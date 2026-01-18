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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Start background worker for processing generation jobs
  startWorker();
});

export default app;
