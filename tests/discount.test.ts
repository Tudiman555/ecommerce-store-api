import { beforeEach, describe, expect, it } from 'vitest';
import type { Store } from '../src/db';
import type { Product } from '../src/models/product';
import { generateDiscountCode, validateDiscountCode } from '../src/services/discount';

// config defaults: nthOrder=5, discountPercentage=10 (no .env in test env)

function createTestStore(): Store {
  const products = new Map<string, Product>();
  products.set('prod-1', { id: 'prod-1', name: 'Widget', price: 9.99, stock: 10 });
  return {
    products,
    users: new Map(),
    carts: new Map(),
    orders: [],
    orderCounter: 0,
    lastClaimedMilestone: 0,
    discountCodes: new Map(),
  };
}

describe('generateDiscountCode', () => {
  let store: Store;

  beforeEach(() => {
    store = createTestStore();
  });

  it('throws 400 when no orders have been placed', () => {
    let error: any;
    try {
      generateDiscountCode(store);
    } catch (err) {
      error = err;
    }
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('No orders placed yet');
  });

  it('throws 400 when order count has not reached the first milestone', () => {
    store.orderCounter = 3;
    let error: any;
    try {
      generateDiscountCode(store);
    } catch (err) {
      error = err;
    }
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('Discount condition not met');
    expect(error.message).toContain('#5'); // next milestone
  });

  it('generates a code exactly at the nth milestone', () => {
    store.orderCounter = 5;
    const code = generateDiscountCode(store);
    expect(code.code).toMatch(/^SAVE-/);
    expect(code.used).toBe(false);
    expect(store.discountCodes.has(code.code)).toBe(true);
    expect(store.lastClaimedMilestone).toBe(5);
  });

  it('throws 400 when current milestone is already claimed', () => {
    store.orderCounter = 5;
    generateDiscountCode(store);
    let error: any;
    try {
      generateDiscountCode(store);
    } catch (err) {
      error = err;
    }
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('#10'); // tells admin when the next one is
  });

  it('still allows generation when admin is late and counter has moved past the milestone', () => {
    store.orderCounter = 7; // milestone #5 passed, admin is late
    const code = generateDiscountCode(store);
    expect(code.used).toBe(false);
    expect(store.lastClaimedMilestone).toBe(5); // anchors to #5, not #7
  });

  it('does not double-count: claiming #5 at order #7 blocks another claim before #10', () => {
    store.orderCounter = 7;
    generateDiscountCode(store); // claims #5
    let error: any;
    try {
      generateDiscountCode(store); // still at #7, next milestone is #10
    } catch (err) {
      error = err;
    }
    expect(error.statusCode).toBe(400);
  });

  it('stacks missed milestones: two codes can be generated at order #12', () => {
    store.orderCounter = 12; // milestones #5 and #10 both passed, neither claimed

    const first = generateDiscountCode(store);  // claims #5 first (oldest)
    expect(store.lastClaimedMilestone).toBe(5);

    const second = generateDiscountCode(store); // claims #10 next
    expect(store.lastClaimedMilestone).toBe(10);

    // Both codes are distinct and stored
    expect(first.code).not.toBe(second.code);
    expect(store.discountCodes.size).toBe(2);
  });

  it('stops after all missed milestones are claimed', () => {
    store.orderCounter = 12;
    generateDiscountCode(store); // claims #5
    generateDiscountCode(store); // claims #10

    let error: any;
    try {
      generateDiscountCode(store); // #15 not reached yet
    } catch (err) {
      error = err;
    }
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('#15');
  });

  it('allows a new code once the next milestone is reached', () => {
    store.orderCounter = 5;
    generateDiscountCode(store);
    store.orderCounter = 10;
    const code = generateDiscountCode(store);
    expect(code.used).toBe(false);
    expect(store.lastClaimedMilestone).toBe(10);
  });
});

describe('validateDiscountCode', () => {
  let store: Store;

  beforeEach(() => {
    store = createTestStore();
  });

  it('throws 404 for an unknown code', () => {
    let error: any;
    try {
      validateDiscountCode(store, 'FAKE-CODE');
    } catch (err) {
      error = err;
    }
    expect(error.statusCode).toBe(404);
  });

  it('throws 400 for a code that has already been used', () => {
    store.discountCodes.set('USED-CODE', { code: 'USED-CODE', used: true, createdAt: new Date() });
    let error: any;
    try {
      validateDiscountCode(store, 'USED-CODE');
    } catch (err) {
      error = err;
    }
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('already been used');
  });

  it('returns the discount code record for a valid unused code', () => {
    store.discountCodes.set('VALID-CODE', { code: 'VALID-CODE', used: false, createdAt: new Date() });
    const record = validateDiscountCode(store, 'VALID-CODE');
    expect(record.code).toBe('VALID-CODE');
    expect(record.used).toBe(false);
  });
});
