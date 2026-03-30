import type { RequestHandler } from 'express';
import { z } from 'zod';
import { addItemToCart, getCart } from '../services/cart';
import { addItemSchema, cartParamsSchema } from '../schemas/cart';
import { getStore } from '../db';

export const addItem: RequestHandler = (req, res, next) => {
  try {
    // TODO V2: check if user exist or not we don't store user right now 
    const params = cartParamsSchema.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: z.prettifyError(params.error) });
      return;
    }

    const body = addItemSchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: z.prettifyError(body.error) });
      return;
    }

    const cart = addItemToCart(getStore(), params.data.userId, body.data.productId, body.data.quantity);
    res.status(201).json(cart);
  } catch (err) {
    next(err);
  }
};

export const getCartHandler: RequestHandler = (req, res, next) => {
  try {
    const params = cartParamsSchema.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: z.prettifyError(params.error) });
      return;
    }

    const cart = getCart(getStore(), params.data.userId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
};
