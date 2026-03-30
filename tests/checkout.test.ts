import { beforeEach, describe, expect, it } from 'vitest';
import type { Store } from '../src/db';
import type { Product } from '../src/models/product';
import { addItemToCart } from '../src/services/cart';
import { checkout } from '../src/services/checkout';

function createTestStore(): Store {
  const products = new Map<string, Product>();
  products.set('prod-1', { id: 'prod-1', name: 'Widget', price: 10.00, stock: 5 });
  products.set('prod-2', { id: 'prod-2', name: 'Gadget', price: 20.00, stock: 3 });
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

describe('checkout', () => {
  let store: Store;

  beforeEach(() => {
    store = createTestStore();
  });

  it('throws 400 when the cart is empty', () => {
    let error: any;
    try {
      checkout(store, { userId: 'user-1' });
    } catch (err) {
      error = err;
    }
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Cart is empty');
  });

  it('throws 400 when the cart has no items (no cart created)', () => {
    let error: any;
    try {
      checkout(store, { userId: 'ghost-user' });
    } catch (err) {
      error = err;
    }
    expect(error.statusCode).toBe(400);
  });

  it('throws 404 when a discount code does not exist', () => {
    addItemToCart(store, 'user-1', 'prod-1', 1);
    let error: any;
    try {
      checkout(store, { userId: 'user-1', discountCode: 'NONEXISTENT' });
    } catch (err) {
      error = err;
    }
    expect(error.statusCode).toBe(404);
  });

  it('throws 400 when a discount code has already been used', () => {
    store.discountCodes.set('USED', { code: 'USED', used: true, createdAt: new Date() });
    addItemToCart(store, 'user-1', 'prod-1', 1);
    let error: any;
    try {
      checkout(store, { userId: 'user-1', discountCode: 'USED' });
    } catch (err) {
      error = err;
    }
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('already been used');
  });

  it('throws 409 when a product does not have enough stock', () => {
    addItemToCart(store, 'user-1', 'prod-1', 99); // stock is only 5
    let error: any;
    try {
      checkout(store, { userId: 'user-1' });
    } catch (err) {
      error = err;
    }
    expect(error.statusCode).toBe(409);
    expect(error.message).toContain('Insufficient stock');
  });

  it('creates an order with correct totals and clears the cart', () => {
    addItemToCart(store, 'user-1', 'prod-1', 2); // 2 × $10 = $20
    addItemToCart(store, 'user-1', 'prod-2', 1); // 1 × $20 = $20
    const order = checkout(store, { userId: 'user-1' });

    expect(order.id).toBe('ORD-1');
    expect(order.userId).toBe('user-1');
    expect(order.items).toHaveLength(2);
    expect(order.total).toBe(40.00);
    expect(order.discountCode).toBeUndefined();
    expect(order.discountAmount).toBeUndefined();

    // Cart should be cleared
    expect(store.carts.has('user-1')).toBe(false);
  });

  it('increments the order counter after each checkout', () => {
    addItemToCart(store, 'user-1', 'prod-1', 1);
    checkout(store, { userId: 'user-1' });
    expect(store.orderCounter).toBe(1);

    addItemToCart(store, 'user-2', 'prod-2', 1);
    checkout(store, { userId: 'user-2' });
    expect(store.orderCounter).toBe(2);
  });

  it('decrements stock after checkout', () => {
    addItemToCart(store, 'user-1', 'prod-1', 3);
    checkout(store, { userId: 'user-1' });
    expect(store.products.get('prod-1')!.stock).toBe(2); // 5 - 3
  });

  it('applies a valid discount code and marks it as used', () => {
    store.discountCodes.set('SAVE10', { code: 'SAVE10', used: false, createdAt: new Date() });
    addItemToCart(store, 'user-1', 'prod-1', 2); // $20 subtotal
    const order = checkout(store, { userId: 'user-1', discountCode: 'SAVE10' });

    // config default: discountPercentage=10, so $20 × 10% = $2 off
    expect(order.discountCode).toBe('SAVE10');
    expect(order.discountAmount).toBe(2.00);
    expect(order.total).toBe(18.00);

    // Code should be marked used
    expect(store.discountCodes.get('SAVE10')!.used).toBe(true);
  });

  it('does not apply a discount when no code is provided', () => {
    addItemToCart(store, 'user-1', 'prod-1', 1);
    const order = checkout(store, { userId: 'user-1' });
    expect(order.discountAmount).toBeUndefined();
    expect(order.total).toBe(10.00);
  });

  it('snapshots the product price at checkout time', () => {
    addItemToCart(store, 'user-1', 'prod-1', 1);
    // Mutate product price after adding to cart but before checkout
    store.products.get('prod-1')!.price = 999;
    const order = checkout(store, { userId: 'user-1' });
    // Order should reflect the price at checkout, not the original add-to-cart price
    expect(order.items[0]!.price).toBe(999);
    expect(order.total).toBe(999);
  });
});
