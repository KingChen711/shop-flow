import 'server-only';

import type { Product, ProductFilters, ListProductsResponse, Category } from '@/lib/api/products';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Server-only: Fetch products list
export async function getProducts(filters?: ProductFilters): Promise<ListProductsResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.categoryId) params.set('categoryId', filters.categoryId);
  if (filters?.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters?.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters?.search) params.set('search', filters.search);
  if (filters?.sortBy) params.set('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`;

  try {
    // Use default caching behavior - controlled by page-level revalidate
    const response = await fetch(url);

    if (!response.ok) {
      console.error('[getProducts] Failed:', response.status, response.statusText);
      return { products: [], total: 0, page: 1, limit: 12, totalPages: 0 };
    }

    return response.json();
  } catch (error) {
    console.error('[getProducts] Error:', error);
    return { products: [], total: 0, page: 1, limit: 12, totalPages: 0 };
  }
}

// Server-only: Fetch single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  try {
    // Use default caching behavior - controlled by page-level revalidate
    const response = await fetch(`${API_BASE_URL}/products/${id}`);

    if (!response.ok) {
      console.error('[getProductById] Failed:', response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('[getProductById] Error:', error);
    return null;
  }
}

// Server-only: Fetch all categories
export async function getCategories(parentId?: string): Promise<Category[]> {
  try {
    const url = parentId
      ? `${API_BASE_URL}/categories?parentId=${parentId}`
      : `${API_BASE_URL}/categories`;

    // Use default caching behavior - controlled by page-level revalidate
    const response = await fetch(url);

    if (!response.ok) {
      console.error('[getCategories] Failed:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();

    // Handle both response formats: { categories: [...] } or direct array
    const categories = Array.isArray(data) ? data : data.categories || [];
    return categories;
  } catch (error) {
    console.error('[getCategories] Error:', error);
    return [];
  }
}

// Server-only: Search products
export async function searchProducts(
  query: string,
  filters?: Omit<ProductFilters, 'search'>
): Promise<ListProductsResponse> {
  const params = new URLSearchParams();
  params.set('q', query);

  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.categoryId) params.set('categoryId', filters.categoryId);
  if (filters?.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters?.maxPrice) params.set('maxPrice', String(filters.maxPrice));

  try {
    // Use default caching behavior - controlled by page-level revalidate
    const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`);

    if (!response.ok) {
      console.error('[searchProducts] Failed:', response.status);
      return { products: [], total: 0, page: 1, limit: 12, totalPages: 0 };
    }

    return response.json();
  } catch (error) {
    console.error('[searchProducts] Error:', error);
    return { products: [], total: 0, page: 1, limit: 12, totalPages: 0 };
  }
}
