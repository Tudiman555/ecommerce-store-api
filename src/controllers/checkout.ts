import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getStore } from '../db';
import { checkoutBodySchema, checkoutParamsSchema } from '../schemas/checkout';
import { checkout } from '../services/checkout';

export const checkoutHandler: RequestHandler = (req, res, next) => {
  try {
    const params = checkoutParamsSchema.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: z.prettifyError(params.error) });
      return;
    }

    const body = checkoutBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: z.prettifyError(body.error) });
      return;
    }

    const order = checkout(getStore(), {
      userId: params.data.userId,
      ...(body.data.discountCode !== undefined && { discountCode: body.data.discountCode }),
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};
