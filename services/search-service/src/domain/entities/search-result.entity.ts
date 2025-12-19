import { SearchProduct, ProductAttribute } from './search-product.entity';

export interface ProductHit {
  product: SearchProduct;
  score: number;
  highlights: string[];
}

export interface FacetBucket {
  key: string;
  count: number;
}

export interface FacetResult {
  field: string;
  buckets: FacetBucket[];
}

export interface SearchResultProps {
  hits: ProductHit[];
  total: number;
  page: number;
  limit: number;
  facets: FacetResult[];
  tookMs: number;
}

export class SearchResult {
  constructor(
    public readonly hits: ProductHit[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
    public readonly facets: FacetResult[],
    public readonly tookMs: number
  ) {}

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  static create(props: SearchResultProps): SearchResult {
    return new SearchResult(
      props.hits,
      props.total,
      props.page,
      props.limit,
      props.facets,
      props.tookMs
    );
  }

  static empty(page: number, limit: number): SearchResult {
    return new SearchResult([], 0, page, limit, [], 0);
  }
}

export interface Suggestion {
  text: string;
  type: 'product' | 'category' | 'keyword';
  productId?: string;
}

export interface IndexStats {
  indexName: string;
  documentCount: number;
  sizeBytes: number;
  health: 'green' | 'yellow' | 'red';
  lastUpdated: Date;
}
