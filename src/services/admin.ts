import { Store } from '../db';
import { DiscountCode } from '../models/discountCode';

export type AdminStats = {
  totalOrders: number;
  totalItemsPurchased: number;
  totalRevenue: number;
  totalDiscountGiven: number;
  discountCodes: DiscountCode[];
};

export function getAdminStats(store: Store): AdminStats {
  let totalItemsPurchased = 0;
  let totalRevenue = 0;
  let totalDiscountGiven = 0;

  for (const order of store.orders) {
    for (const item of order.items) {
      totalItemsPurchased += item.quantity;
    }
    totalRevenue += order.total;
    totalDiscountGiven += order.discountAmount ?? 0;
  }

  return {
    totalOrders: store.orders.length,
    totalItemsPurchased,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalDiscountGiven: parseFloat(totalDiscountGiven.toFixed(2)),
    discountCodes: [...store.discountCodes.values()],
  };
}
