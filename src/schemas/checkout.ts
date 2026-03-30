import { z } from 'zod';

export const checkoutParamsSchema = z.object({
  userId: z.string().min(1),
});

export const checkoutBodySchema = z.object({
  discountCode: z.string().min(1).optional(),
});
