import { apiClient } from './client';

// Product type matching backend API Gateway response
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

// Extended product for display (adds computed fields)
export interface ProductDisplay extends Product {
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt?: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

  search: (query: string, filters?: Omit<ProductFilters, 'search'>) =>
    apiClient.get<ListProductsResponse>('/search', {
      q: query,
      ...filters,
    } as Record<string, string | number | undefined>),

  getCategories: (parentId?: string) =>
    apiClient.get<ListCategoriesResponse>('/categories', parentId ? { parentId } : undefined),

  getCategoryById: (id: string) => apiClient.get<Category>(`/categories/${id}`),
};
