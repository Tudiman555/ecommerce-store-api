import type { RequestHandler } from 'express';
import { getStore } from '../db';
import { AppError } from './errorHandler';

export const validateUser: RequestHandler = (req, _res, next) => {
  const { userId } = req.params as {userId: string};
  const store = getStore();

  if (!store.users.has(userId)) {
    return next(new AppError(`User '${userId}' not found`, 404));
  }

  next();
};
