export type CartItem = {
  productId: string;
  quantity: number;
};

export type Cart = {
  userId: string;
  items: CartItem[];
};
