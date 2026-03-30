import { Cart } from "../models/cart";
import { DiscountCode } from "../models/discountCode";
import { Order } from "../models/order";
import { Product } from "../models/product";
import { User } from "../models/user";
import { SEED_PRODUCTS, SEED_USERS } from "../seeder";

export type Store = {
  products: Map<string, Product>;
  users: Map<string, User>;                  // userId -> user fast lookup
  carts: Map<string, Cart>;                  // userId -> cart fast lookup
  orders: Order[];
  orderCounter: number;
  lastClaimedMilestone: number;      // the nth-order milestone (e.g. 5, 10, 15) for which a code was last issued
  discountCodes: Map<string, DiscountCode>;
};

function createStore(): Store {
  const products = new Map<string, Product>();
  for (const p of SEED_PRODUCTS) {
    products.set(p.id, p);
  }

  const users = new Map<string, User>();
  for (const u of SEED_USERS) {
    users.set(u.id, u);
  }

  return {
    products,
    users,
    carts: new Map(),
    orders: [],
    orderCounter: 0,
    lastClaimedMilestone: 0,
    discountCodes: new Map(),
  };
}

let store: Store = createStore();

export function getStore(): Store {
  return store;
}

export function resetStore(): void {
  store = createStore();
}
