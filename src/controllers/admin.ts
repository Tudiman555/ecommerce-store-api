import type { RequestHandler } from 'express';
import { getStore } from '../db';
import { getAdminStats } from '../services/admin';
import { generateDiscountCode } from '../services/discount';

export const generateDiscountCodeHandler: RequestHandler = (_,res, next) => {
  try {
    const code = generateDiscountCode(getStore());
    res.status(201).json(code);
  } catch (err) {
    next(err);
  }
};

export const getStatsHandler: RequestHandler = (req, res, next) => {
  try {
    const stats = getAdminStats(getStore());
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
