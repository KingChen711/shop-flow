import { apiClient } from './client';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusResponse {
  orderId: string;
  status: OrderStatus;
  statusMessage?: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: string;
  notes?: string;
}

export interface ListOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export const ordersApi = {
  getAll: (filters?: OrderFilters) =>
    apiClient.get<ListOrdersResponse>(
      '/orders',
      filters as Record<string, string | number | undefined>
    ),

  getById: (id: string) => apiClient.get<Order>(`/orders/${id}`),

  getStatus: (id: string) => apiClient.get<OrderStatusResponse>(`/orders/${id}/status`),

  create: (data: CreateOrderDto) => apiClient.post<Order>('/orders', data),

  cancel: (id: string, reason?: string) =>
    apiClient.post<Order>(`/orders/${id}/cancel`, { reason }),
};
