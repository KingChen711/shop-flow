import { apiClient, type PaginatedResponse } from './client';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  specifications?: Record<string, string>;
}

export interface ProductFilters {
  page?: number;
  pageSize?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'price' | 'rating' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

export const productsApi = {
  getAll: (filters?: ProductFilters) =>
    apiClient.get<PaginatedResponse<Product>>(
      '/api/products',
      filters as Record<string, string | number | undefined>
    ),

  getById: (id: string) => apiClient.get<Product>(`/api/products/${id}`),

  getByCategory: (category: string, filters?: ProductFilters) =>
    apiClient.get<PaginatedResponse<Product>>(
      `/api/products/category/${category}`,
      filters as Record<string, string | number | undefined>
    ),

  search: (query: string) =>
    apiClient.get<PaginatedResponse<Product>>('/api/products/search', { q: query }),

  getFeatured: () => apiClient.get<Product[]>('/api/products/featured'),

  getRelated: (productId: string) => apiClient.get<Product[]>(`/api/products/${productId}/related`),
};
