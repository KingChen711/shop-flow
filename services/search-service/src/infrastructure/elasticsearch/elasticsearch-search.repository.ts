import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { ISearchRepository, SearchOptions } from '@domain/repositories/search.repository.interface';
import { SearchProduct } from '@domain/entities/search-product.entity';
import {
  SearchResult,
  ProductHit,
  Suggestion,
  IndexStats,
  FacetResult,
  FacetBucket,
} from '@domain/entities/search-result.entity';

@Injectable()
export class ElasticsearchSearchRepository implements ISearchRepository {
  private readonly logger = new Logger(ElasticsearchSearchRepository.name);
  private readonly indexName: string;

  constructor(
    private readonly client: Client,
    private readonly configService: ConfigService
  ) {
    this.indexName = this.configService.get('ELASTICSEARCH_INDEX', 'products');
  }

  async createIndex(): Promise<void> {
    try {
      await this.client.indices.create({
        index: this.indexName,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                product_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding', 'edge_ngram_filter'],
                },
                search_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding'],
                },
              },
              filter: {
                edge_ngram_filter: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 20,
                },
              },
            },
          },
          mappings: {
            properties: {
              name: {
                type: 'text',
                analyzer: 'product_analyzer',
                search_analyzer: 'search_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                  suggest: {
                    type: 'completion',
                    analyzer: 'simple',
                    preserve_separators: true,
                    preserve_position_increments: true,
                    max_input_length: 50,
                  },
                },
              },
              description: {
                type: 'text',
                analyzer: 'product_analyzer',
                search_analyzer: 'search_analyzer',
              },
              price: { type: 'float' },
              category_id: { type: 'keyword' },
              category_name: {
                type: 'text',
                fields: { keyword: { type: 'keyword' } },
              },
              image_urls: { type: 'keyword' },
              attributes: {
                type: 'nested',
                properties: {
                  key: { type: 'keyword' },
                  value: { type: 'keyword' },
                },
              },
              created_at: { type: 'date' },
              updated_at: { type: 'date' },
              name_suggest: {
                type: 'completion',
                analyzer: 'simple',
              },
            },
          },
        },
      });
      this.logger.log(`Created index: ${this.indexName}`);
    } catch (error) {
      if ((error as any)?.meta?.body?.error?.type === 'resource_already_exists_exception') {
        this.logger.log(`Index ${this.indexName} already exists`);
      } else {
        throw error;
      }
    }
  }

  async deleteIndex(): Promise<void> {
    await this.client.indices.delete({ index: this.indexName });
    this.logger.log(`Deleted index: ${this.indexName}`);
  }

  async indexExists(): Promise<boolean> {
    const exists = await this.client.indices.exists({ index: this.indexName });
    return exists;
  }

  async refresh(): Promise<void> {
    await this.client.indices.refresh({ index: this.indexName });
  }

  async indexProduct(product: SearchProduct): Promise<void> {
    await this.client.index({
      index: this.indexName,
      id: product.id,
      body: product.toElasticsearchDocument(),
      refresh: true,
    });
    this.logger.debug(`Indexed product: ${product.id}`);
  }

  async indexProducts(products: SearchProduct[]): Promise<void> {
    if (products.length === 0) return;

    const body = products.flatMap((product) => [
      { index: { _index: this.indexName, _id: product.id } },
      product.toElasticsearchDocument(),
    ]);

    const response = await this.client.bulk({ body, refresh: true });

    if (response.errors) {
      const errorItems = response.items.filter((item) => item.index?.error);
      this.logger.error(`Bulk indexing errors: ${JSON.stringify(errorItems)}`);
    }

    this.logger.log(`Bulk indexed ${products.length} products`);
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id: productId,
        refresh: true,
      });
      this.logger.debug(`Deleted product from index: ${productId}`);
    } catch (error) {
      if ((error as any)?.meta?.statusCode === 404) {
        this.logger.warn(`Product not found in index: ${productId}`);
      } else {
        throw error;
      }
    }
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const { query, categoryIds, minPrice, maxPrice, facets, sortBy, page, limit } = options;

    // Build query
    const must: any[] = [];
    const filter: any[] = [];

    // Full-text search
    if (query && query.trim()) {
      must.push({
        multi_match: {
          query: query.trim(),
          fields: ['name^3', 'description', 'category_name'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    // Category filter
    if (categoryIds && categoryIds.length > 0) {
      filter.push({ terms: { category_id: categoryIds } });
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      const rangeFilter: any = { range: { price: {} } };
      if (minPrice !== undefined) rangeFilter.range.price.gte = minPrice;
      if (maxPrice !== undefined) rangeFilter.range.price.lte = maxPrice;
      filter.push(rangeFilter);
    }

    // Additional facet filters
    if (facets && facets.length > 0) {
      for (const facet of facets) {
        if (facet.field === 'category_id') {
          filter.push({ terms: { category_id: facet.values } });
        } else if (facet.field === 'attributes') {
          // Nested query for attributes
          for (const value of facet.values) {
            const [key, val] = value.split(':');
            filter.push({
              nested: {
                path: 'attributes',
                query: {
                  bool: {
                    must: [
                      { term: { 'attributes.key': key } },
                      { term: { 'attributes.value': val } },
                    ],
                  },
                },
              },
            });
          }
        }
      }
    }

    // Build sort
    const sort = this.buildSort(sortBy);

    // Execute search
    const from = (page - 1) * limit;
    const response = await this.client.search({
      index: this.indexName,
      body: {
        from,
        size: limit,
        query: {
          bool: {
            must,
            filter,
          },
        },
        sort,
        highlight: {
          fields: {
            name: {},
            description: { number_of_fragments: 3 },
          },
          pre_tags: ['<em>'],
          post_tags: ['</em>'],
        },
        aggs: {
          categories: {
            terms: { field: 'category_id', size: 20 },
          },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { to: 25 },
                { from: 25, to: 50 },
                { from: 50, to: 100 },
                { from: 100, to: 250 },
                { from: 250 },
              ],
            },
          },
        },
      },
    });

    // Parse results
    const hits: ProductHit[] = response.hits.hits.map((hit: any) => ({
      product: SearchProduct.fromElasticsearch(hit._source, hit._id),
      score: hit._score || 0,
      highlights: this.extractHighlights(hit.highlight),
    }));

    const total =
      typeof response.hits.total === 'number'
        ? response.hits.total
        : response.hits.total?.value || 0;

    const facetResults = this.parseAggregations(response.aggregations);

    return SearchResult.create({
      hits,
      total,
      page,
      limit,
      facets: facetResults,
      tookMs: response.took,
    });
  }

  async getSuggestions(prefix: string, limit: number): Promise<Suggestion[]> {
    const response = await this.client.search({
      index: this.indexName,
      body: {
        suggest: {
          product_suggest: {
            prefix,
            completion: {
              field: 'name.suggest',
              size: limit,
              skip_duplicates: true,
              fuzzy: {
                fuzziness: 'AUTO',
              },
            },
          },
        },
      },
    });

    const suggestions: Suggestion[] = [];
    const suggestResults = (response.suggest as any)?.product_suggest?.[0]?.options || [];

    for (const option of suggestResults) {
      suggestions.push({
        text: option.text,
        type: 'product',
        productId: option._id,
      });
    }

    return suggestions;
  }

  async getStats(): Promise<IndexStats> {
    const [countResponse, statsResponse, healthResponse] = await Promise.all([
      this.client.count({ index: this.indexName }),
      this.client.indices.stats({ index: this.indexName }),
      this.client.cluster.health({ index: this.indexName }),
    ]);

    const indexStats = statsResponse.indices?.[this.indexName];

    return {
      indexName: this.indexName,
      documentCount: countResponse.count || 0,
      sizeBytes: indexStats?.primaries?.store?.size_in_bytes || 0,
      health: healthResponse.status as 'green' | 'yellow' | 'red',
      lastUpdated: new Date(),
    };
  }

  private buildSort(sortBy?: string): any[] {
    switch (sortBy) {
      case 'price_asc':
        return [{ price: 'asc' }];
      case 'price_desc':
        return [{ price: 'desc' }];
      case 'name':
        return [{ 'name.keyword': 'asc' }];
      case 'newest':
        return [{ created_at: 'desc' }];
      case 'relevance':
      default:
        return [{ _score: 'desc' }];
    }
  }

  private extractHighlights(highlight: any): string[] {
    if (!highlight) return [];
    const highlights: string[] = [];
    for (const field of Object.values(highlight)) {
      if (Array.isArray(field)) {
        highlights.push(...field);
      }
    }
    return highlights;
  }

  private parseAggregations(aggregations: any): FacetResult[] {
    const results: FacetResult[] = [];

    if (aggregations?.categories) {
      results.push({
        field: 'category_id',
        buckets: aggregations.categories.buckets.map((b: any) => ({
          key: b.key,
          count: b.doc_count,
        })),
      });
    }

    if (aggregations?.price_ranges) {
      results.push({
        field: 'price',
        buckets: aggregations.price_ranges.buckets.map((b: any) => ({
          key: b.key,
          count: b.doc_count,
        })),
      });
    }

    return results;
  }
}
