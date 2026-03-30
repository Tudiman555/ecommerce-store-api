import { z } from 'zod';

// if need be we can add variant in future
export const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const cartParamsSchema = z.object({
  userId: z.string().min(1),
});
