import { apiClient, type PaginatedResponse } from './client';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: {
    cardNumber: string;
    expiry: string;
    cvc: string;
    nameOnCard: string;
  };
}

export const ordersApi = {
  getAll: (page?: number, pageSize?: number) =>
    apiClient.get<PaginatedResponse<Order>>('/api/orders', { page, pageSize }),

  getById: (id: string) => apiClient.get<Order>(`/api/orders/${id}`),

  create: (data: CreateOrderDto) => apiClient.post<Order>('/api/orders', data),

  cancel: (id: string) => apiClient.post<Order>(`/api/orders/${id}/cancel`),
};
