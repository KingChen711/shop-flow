import { apiClient, type PaginatedResponse, type PaginationParams } from './client';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  notes?: string;
}

export interface OrderFilters extends PaginationParams {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
}

export interface OrderStats {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalOrders: number;
  totalRevenue: number;
}

export const ordersApi = {
  getAll: (filters?: OrderFilters) =>
    apiClient.get<PaginatedResponse<Order>>(
      '/api/orders',
      filters as Record<string, string | number | undefined>
    ),

  getById: (id: string) => apiClient.get<Order>(`/api/orders/${id}`),

  updateStatus: (id: string, data: UpdateOrderStatusDto) =>
    apiClient.patch<Order>(`/api/orders/${id}/status`, data),

  cancel: (id: string, reason?: string) =>
    apiClient.post<Order>(`/api/orders/${id}/cancel`, { reason }),

  getStats: () => apiClient.get<OrderStats>('/api/orders/stats'),
};
