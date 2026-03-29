import type { ErrorRequestHandler } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    logger.error(err.message, { statusCode: err.statusCode, method: req.method, path: req.path });
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  logger.error('Unhandled error', { method: req.method, path: req.path, error: String(err) });
  res.status(500).json({ error: 'Internal server error' });
};
