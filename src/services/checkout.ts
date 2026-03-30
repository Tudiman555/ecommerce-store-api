import { config } from '../config';
import { Store } from '../db';
import { AppError } from '../middlewares/errorHandler';
import { Order, OrderStatus } from '../models/order';
import { clearCart } from './cart';
import { validateDiscountCode } from './discount';

export type CheckoutInput = {
  userId: string;
  discountCode?: string;
};

/**
 * Places an order for the user:
 *  1. Validates cart is non-empty
 *  2. Validates discount code (if provided)
 *  3. Validates stock for every item
 *  4. Snapshots prices, applies discount, creates Order
 *  5. Decrements stock, marks code used, clears cart, increments counter
 */
export function checkout(store: Store, input: CheckoutInput): Order {
  const { userId, discountCode } = input;

  const cart = store.carts.get(userId);
  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Validate discount code upfront — before touching any mutable state
  const discountRecord = discountCode
    ? validateDiscountCode(store, discountCode)
    : undefined;

  // Validate stock availability for every item before committing
  for (const item of cart.items) {
    const product = store.products.get(item.productId);
    if (!product) {
      throw new AppError(`Product '${item.productId}' no longer exists`, 404);
    }
    if (product.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for '${product.name}'. Available: ${product.stock}, requested: ${item.quantity}`,
        409,
      );
    }
  }

  // Build order items — snapshot name + price at checkout time so order history
  // remains accurate even if products are later updated
  const orderItems = cart.items.map((item) => {
    // Safe: existence and stock already validated above
    const product = store.products.get(item.productId)!;
    return {
      productId: item.productId,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal: parseFloat((product.price * item.quantity).toFixed(2)),
    };
  });

  const subtotal = parseFloat(
    orderItems.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2),
  );

  const discountAmount = discountRecord
    ? parseFloat((subtotal * (config.discountPercentage / 100)).toFixed(2))
    : 0;

  const total = parseFloat((subtotal - discountAmount).toFixed(2));

  // --- Commit phase (all validation passed) ---

  // Decrement stock
  for (const item of cart.items) {
    const product = store.products.get(item.productId)!;
    product.stock -= item.quantity;
  }

  // Mark discount code as used
  if (discountRecord) {
    discountRecord.used = true;
  }

  // Create the order
  store.orderCounter++;
  const order: Order = {
    id: `ORD-${store.orderCounter}`,
    userId,
    items: orderItems,
    total,
    status: OrderStatus.PENDING,
    createdAt: new Date(),
    // Only include optional fields when they carry a meaningful value
    ...(discountCode !== undefined && { discountCode }),
    ...(discountAmount > 0 && { discountAmount }),
  };

  store.orders.push(order);
  clearCart(store, userId);

  return order;
}
