import { Store } from '../db';
import { AppError } from '../middlewares/errorHandler';
import { Cart } from '../models/cart';

export type EnrichedCartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type CartResponse = {
  userId: string;
  items: EnrichedCartItem[];
  total: number;
};

export function addItemToCart(store: Store, userId: string, productId: string, quantity: number): Cart {
  const product = store.products.get(productId);
  
  if (!product) {
    throw new AppError(`Product '${productId}' not found`, 404);
  }

  let cart = store.carts.get(userId);
  if (!cart) {
    cart = { userId, items: [] };
    store.carts.set(userId, cart);
  }

  const existing = cart.items.find((i) => i.productId === productId);
  // check if product already exist if yes increase the quantity
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }

  return cart;
}

export function getCart(store: Store, userId: string): CartResponse {
  const cart = store.carts.get(userId);
  if (!cart) {
    return { userId, items: [], total: 0 };
  }

  // make a helper function for this 
  const items: EnrichedCartItem[] = cart.items.map((item) => {
    const product = store.products.get(item.productId);
    // products are seeded and only valid productIds are added via addItemToCart
    const price = product?.price ?? 0;
    const name = product?.name ?? item.productId;
    return {
      productId: item.productId,
      name,
      price,
      quantity: item.quantity,
      subtotal: parseFloat((price * item.quantity).toFixed(2)),
    };
  });
  const total = parseFloat(items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2));

  return { userId, items, total };
}


export function clearCart(store: Store, userId: string): void {
  store.carts.delete(userId);
}
