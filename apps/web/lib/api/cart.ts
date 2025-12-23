import { apiClient } from './client';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export const cartApi = {
  get: () => apiClient.get<Cart>('/api/cart'),

  addItem: (productId: string, quantity: number) =>
    apiClient.post<Cart>('/api/cart/items', { productId, quantity }),

  updateItem: (productId: string, quantity: number) =>
    apiClient.put<Cart>(`/api/cart/items/${productId}`, { quantity }),

  removeItem: (productId: string) => apiClient.delete<Cart>(`/api/cart/items/${productId}`),

  clear: () => apiClient.delete<void>('/api/cart'),
};
