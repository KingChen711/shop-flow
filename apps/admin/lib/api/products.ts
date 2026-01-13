import { apiClient, type PaginationParams } from './client';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName?: string;
  imageUrls: string[];
  attributes: Array<{ key: string; value: string }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt?: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrls?: string[];
  attributes?: Array<{ key: string; value: string }>;
  isActive?: boolean;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentId?: string;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export interface ProductFilters extends PaginationParams {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface ListProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListCategoriesResponse {
  categories: Category[];
}

export const productsApi = {
  getAll: (filters?: ProductFilters) =>
    apiClient.get<ListProductsResponse>(
      '/products',
      filters as Record<string, string | number | undefined>
    ),

  getById: (id: string) => apiClient.get<Product>(`/products/${id}`),

  create: (data: CreateProductDto) => apiClient.post<Product>('/products', data),

  update: (id: string, data: UpdateProductDto) => apiClient.patch<Product>(`/products/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/products/${id}`),

  // Categories
  getCategories: (parentId?: string) =>
    apiClient.get<ListCategoriesResponse>('/categories', parentId ? { parentId } : undefined),

  getCategoryById: (id: string) => apiClient.get<Category>(`/categories/${id}`),

  createCategory: (data: CreateCategoryDto) => apiClient.post<Category>('/categories', data),

  updateCategory: (id: string, data: UpdateCategoryDto) =>
    apiClient.patch<Category>(`/categories/${id}`, data),

  deleteCategory: (id: string) => apiClient.delete<void>(`/categories/${id}`),
};
