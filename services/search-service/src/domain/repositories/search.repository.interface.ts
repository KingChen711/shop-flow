import { SearchProduct } from '../entities/search-product.entity';
import {
  SearchResult,
  Suggestion,
  IndexStats,
  FacetResult,
} from '../entities/search-result.entity';

export interface SearchOptions {
  query: string;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  facets?: Array<{ field: string; values: string[] }>;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest';
  page: number;
  limit: number;
}

export interface ISearchRepository {
  // Index operations
  indexProduct(product: SearchProduct): Promise<void>;
  indexProducts(products: SearchProduct[]): Promise<void>;
  deleteProduct(productId: string): Promise<void>;

  // Search operations
  search(options: SearchOptions): Promise<SearchResult>;
  getSuggestions(prefix: string, limit: number): Promise<Suggestion[]>;

  // Index management
  createIndex(): Promise<void>;
  deleteIndex(): Promise<void>;
  indexExists(): Promise<boolean>;
  getStats(): Promise<IndexStats>;
  refresh(): Promise<void>;
}

export const SEARCH_REPOSITORY = 'SearchRepository';
