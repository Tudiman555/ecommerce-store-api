import express from 'express';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import router from './routes';

const app = express();

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    // This is helpful if we want to setup monitoring in the future 
    logger.info(`${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', router);

// 404 handler
app.use((_req, res) => {
  // TODO: Make a enum for error code 
  res.status(404).json({ message: 'Route not found' });
});

// global error handler
app.use(errorHandler);

export default app;
