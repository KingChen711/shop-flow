export interface FacetFilter {
  field: string;
  values: string[];
}

export class SearchProductsQuery {
  constructor(
    public readonly query: string,
    public readonly categoryIds: string[],
    public readonly minPrice: number | undefined,
    public readonly maxPrice: number | undefined,
    public readonly facets: FacetFilter[],
    public readonly sortBy: string,
    public readonly page: number,
    public readonly limit: number
  ) {}
}
