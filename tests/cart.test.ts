import { describe, it, expect, beforeEach } from 'vitest';
import { addItemToCart, getCart, clearCart } from '../src/services/cart';
import type { Store } from '../src/db';
import type { Product } from '../src/models/product';

function createTestStore(): Store {
  const products = new Map<string, Product>();
  products.set('prod-1', { id: 'prod-1', name: 'Widget', price: 9.99 });
  products.set('prod-2', { id: 'prod-2', name: 'Gadget', price: 14.50 });
  return {
    products,
    users: new Map(),
    carts: new Map(),
    orders: [],
    orderCounter: 0,
    discountCodes: new Map(),
  };
}

describe('addItemToCart', () => {
  let store: Store;

  beforeEach(() => {
    store = createTestStore();
  });

  it('throws AppError with status 404 when product does not exist', () => {
    let error: any;
    try {
      addItemToCart(store, 'user-1', 'nonexistent', 1);
    } catch (err) {
      error = err;
    }
    expect((error).statusCode).toBe(404);
    expect((error).message).toBe("Product 'nonexistent' not found");
  });

  it('creates a new cart and adds the item when user has no cart', () => {
    const cart = addItemToCart(store, 'user-1', 'prod-1', 2);
    expect(cart.userId).toBe('user-1');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toEqual({ productId: 'prod-1', quantity: 2 });
  });

  it('adds a new distinct item to an existing cart', () => {
    addItemToCart(store, 'user-1', 'prod-1', 1);
    const cart = addItemToCart(store, 'user-1', 'prod-2', 3);
    expect(cart.items).toHaveLength(2);
  });

  it('increments quantity when the same product is added again', () => {
    addItemToCart(store, 'user-1', 'prod-1', 2);
    const cart = addItemToCart(store, 'user-1', 'prod-1', 3);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(5);
  });
});

describe('getCart', () => {
  let store: Store;

  beforeEach(() => {
    store = createTestStore();
  });

  it('returns an empty cart when user has no cart', () => {
    const response = getCart(store, 'user-1');
    expect(response).toEqual({ userId: 'user-1', items: [], total: 0 });
  });

  it('returns enriched items with name, price, quantity, and subtotal', () => {
    addItemToCart(store, 'user-1', 'prod-1', 2);
    const response = getCart(store, 'user-1');
    expect(response.items).toHaveLength(1);
    expect(response.items[0]).toEqual({
      productId: 'prod-1',
      name: 'Widget',
      price: 9.99,
      quantity: 2,
      subtotal: 19.98,
    });
  });

  it('calculates the correct total across multiple items', () => {
    addItemToCart(store, 'user-1', 'prod-1', 1); // 9.99
    addItemToCart(store, 'user-1', 'prod-2', 2); // 29.00
    const response = getCart(store, 'user-1');
    expect(response.total).toBe(38.99);
  });
});

describe('clearCart', () => {
  let store: Store;

  beforeEach(() => {
    store = createTestStore();
  });

  it('removes the cart so subsequent getCart returns empty', () => {
    addItemToCart(store, 'user-1', 'prod-1', 1);
    clearCart(store, 'user-1');
    const response = getCart(store, 'user-1');
    expect(response).toEqual({ userId: 'user-1', items: [], total: 0 });
  });

  it('does not throw when clearing a cart that does not exist', () => {
    expect(() => clearCart(store, 'nonexistent-user')).not.toThrow();
  });
});
