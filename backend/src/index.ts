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
