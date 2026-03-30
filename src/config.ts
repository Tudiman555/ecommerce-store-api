import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Infrastructure — differs per environment
  port: parseInt(process.env.PORT ?? '3000', 10),
  // Discount system — every nth order earns a coupon code for x% off
  nthOrder: Math.max(1, parseInt(process.env.NTH_ORDER ?? '5', 10)),
  discountPercentage: Math.max(1, parseInt(process.env.DISCOUNT_PERCENTAGE ?? '10', 10)),
};
