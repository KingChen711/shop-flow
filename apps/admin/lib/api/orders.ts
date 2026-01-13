import { apiClient, type PaginationParams } from './client';

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
  userEmail?: string;
  userName?: string;
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

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
}

export interface OrderFilters extends PaginationParams {
  search?: string;
  status?: OrderStatus;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ListOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export const ordersApi = {
  getAll: (filters?: OrderFilters) =>
    apiClient.get<ListOrdersResponse>(
      '/orders',
      filters as Record<string, string | number | undefined>
    ),

  getById: (id: string) => apiClient.get<Order>(`/orders/${id}`),

  getStatus: (id: string) => apiClient.get<OrderStatusResponse>(`/orders/${id}/status`),

  updateStatus: (id: string, data: UpdateOrderStatusDto) =>
    apiClient.patch<Order>(`/orders/${id}/status`, data),

  cancel: (id: string, reason?: string) =>
    apiClient.post<Order>(`/orders/${id}/cancel`, { reason }),

  getStats: () => apiClient.get<OrderStats>('/orders/stats'),
};
