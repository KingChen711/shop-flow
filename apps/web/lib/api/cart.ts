import { apiClient } from './client';

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  subtotal: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  total: number;
  itemCount: number;
  updatedAt: string;
}

export interface CartSummary {
  userId: string;
  itemCount: number;
  total: number;
}

export interface AddToCartDto {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export const cartApi = {
  get: () => apiClient.get<Cart>('/cart'),

  getSummary: () => apiClient.get<CartSummary>('/cart/summary'),

  addItem: (data: AddToCartDto) => apiClient.post<Cart>('/cart/items', data),

  updateItem: (productId: string, quantity: number) =>
    apiClient.put<Cart>(`/cart/items/${productId}`, { quantity }),

  removeItem: (productId: string) => apiClient.delete<Cart>(`/cart/items/${productId}`),

  clear: () => apiClient.delete<{ success: boolean; message: string }>('/cart'),
};
