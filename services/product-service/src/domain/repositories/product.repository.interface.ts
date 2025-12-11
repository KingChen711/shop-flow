import { Product } from '../entities/product.entity';

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(params: {
    page: number;
    limit: number;
    filters?: ProductFilters;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ products: Product[]; total: number }>;
  save(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  findByCategory(categoryId: string): Promise<Product[]>;
}

export const PRODUCT_REPOSITORY = 'ProductRepository';
