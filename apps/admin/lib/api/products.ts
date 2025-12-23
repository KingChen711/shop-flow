import { apiClient, type PaginatedResponse, type PaginationParams } from './client';

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  categoryId: string;
  category?: Category;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  sku: string;
  price: number;
  categoryId: string;
  stock: number;
  status?: 'active' | 'draft' | 'archived';
  images?: string[];
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductFilters extends PaginationParams {
  search?: string;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
}

export const productsApi = {
  getAll: (filters?: ProductFilters) =>
    apiClient.get<PaginatedResponse<Product>>(
      '/api/products',
      filters as Record<string, string | number | undefined>
    ),

  getById: (id: string) => apiClient.get<Product>(`/api/products/${id}`),

  create: (data: CreateProductDto) => apiClient.post<Product>('/api/products', data),

  update: (id: string, data: UpdateProductDto) =>
    apiClient.patch<Product>(`/api/products/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/api/products/${id}`),

  getCategories: () => apiClient.get<Category[]>('/api/categories'),
};
