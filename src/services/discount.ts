import { config } from '../config';
import { Store } from '../db';
import { AppError } from '../middlewares/errorHandler';
import { DiscountCode } from '../models/discountCode';

// Generates a human-readable, unambiguous code (no I/O/0/1 to avoid misreads)
function makeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'SAVE-';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Generates a discount code if the nth-order milestone has been reached
 * and a code hasn't already been issued for it.
 * Only callable via the admin API.
 */
export function generateDiscountCode(store: Store): DiscountCode {
  const { nthOrder } = config;

  if (store.orderCounter === 0) {
    throw new AppError('No orders placed yet', 400);
  }

  // The next milestone that hasn't been claimed yet (FIFO — oldest first).
  // e.g. lastClaimedMilestone=0, nthOrder=5 → nextToClaim=5
  //      lastClaimedMilestone=5, nthOrder=5 → nextToClaim=10
  const nextToClaimMilestone = store.lastClaimedMilestone + nthOrder;

  // The furthest milestone the current order count has reached.
  const latestMilestone = Math.floor(store.orderCounter / nthOrder) * nthOrder;

  // Eligible when the oldest unclaimed milestone has actually been passed.
  // Multiple missed milestones stack: each call claims one, oldest first.
  if (nextToClaimMilestone > latestMilestone) {
    throw new AppError(
      `Discount condition not met. Next eligible after order #${nextToClaimMilestone}`,
      400,
    );
  }

  const code: DiscountCode = {
    code: makeCode(),
    used: false,
    createdAt: new Date(),
  };

  store.discountCodes.set(code.code, code);
  store.lastClaimedMilestone = nextToClaimMilestone;

  return code;
}

/**
 * Validates a discount code — throws if not found or already used.
 * Returns the DiscountCode record so checkout can mark it used atomically.
 */
export function validateDiscountCode(store: Store, code: string): DiscountCode {
  const record = store.discountCodes.get(code);

  if (!record) {
    throw new AppError(`Discount code '${code}' not found`, 404);
  }

  if (record.used) {
    throw new AppError(`Discount code '${code}' has already been used`, 400);
  }

  return record;
}
