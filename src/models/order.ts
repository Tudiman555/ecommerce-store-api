export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export type OrderItem = {
  productId: string;
  name: string;
  price: number;      // price at time of order
  quantity: number;
  subtotal: number;
};

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  discountCode?: string;
  discountAmount?: number;  // amount deducted, captured at checkout time
  status: OrderStatus;
  createdAt: Date;
};
