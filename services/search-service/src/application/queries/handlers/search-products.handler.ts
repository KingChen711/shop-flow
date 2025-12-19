import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { SearchProductsQuery } from '../search-products.query';
import { SearchResult } from '@domain/entities/search-result.entity';
import {
  ISearchRepository,
  SEARCH_REPOSITORY,
  SearchOptions,
} from '@domain/repositories/search.repository.interface';

@QueryHandler(SearchProductsQuery)
export class SearchProductsHandler implements IQueryHandler<SearchProductsQuery> {
  private readonly logger = new Logger(SearchProductsHandler.name);

  constructor(
    @Inject(SEARCH_REPOSITORY)
    private readonly searchRepository: ISearchRepository
  ) {}

  async execute(query: SearchProductsQuery): Promise<SearchResult> {
    this.logger.log(`Searching products: "${query.query}" page=${query.page}`);

    const options: SearchOptions = {
      query: query.query,
      categoryIds: query.categoryIds.length > 0 ? query.categoryIds : undefined,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      facets: query.facets.length > 0 ? query.facets : undefined,
      sortBy: this.mapSortBy(query.sortBy),
      page: query.page || 1,
      limit: query.limit || 10,
    };

    const result = await this.searchRepository.search(options);

    this.logger.log(`Found ${result.total} products in ${result.tookMs}ms`);

    return result;
  }

  private mapSortBy(sortBy: string): 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest' {
    const validSorts = ['relevance', 'price_asc', 'price_desc', 'name', 'newest'];
    return validSorts.includes(sortBy)
      ? (sortBy as 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest')
      : 'relevance';
  }
}
