import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as grpc from '@grpc/grpc-js';

// Queries
import { SearchProductsQuery } from '@application/queries/search-products.query';
import { GetSuggestionsQuery } from '@application/queries/get-suggestions.query';
import { GetIndexStatsQuery } from '@application/queries/get-index-stats.query';

// Commands
import { IndexProductCommand } from '@application/commands/index-product.command';
import { DeleteProductCommand } from '@application/commands/delete-product.command';
import { ReindexAllCommand } from '@application/commands/reindex-all.command';
import { ReindexResult } from '@application/commands/handlers/reindex-all.handler';

// Domain
import { SearchResult, Suggestion, IndexStats } from '@domain/entities/search-result.entity';

@Controller()
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @GrpcMethod('SearchService', 'SearchProducts')
  async searchProducts(data: any): Promise<any> {
    try {
      this.logger.log(`Search request: "${data.query}"`);

      const query = new SearchProductsQuery(
        data.query || '',
        data.category_ids || [],
        data.min_price,
        data.max_price,
        this.mapFacets(data.facets),
        data.sort_by || 'relevance',
        data.page || 1,
        data.limit || 10
      );

      const result: SearchResult = await this.queryBus.execute(query);

      return this.toSearchResponse(result);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('SearchService', 'GetSuggestions')
  async getSuggestions(data: any): Promise<any> {
    try {
      const query = new GetSuggestionsQuery(data.prefix || '', data.limit || 5);

      const suggestions: Suggestion[] = await this.queryBus.execute(query);

      return {
        suggestions: suggestions.map((s) => ({
          text: s.text,
          type: s.type,
          product_id: s.productId || '',
        })),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('SearchService', 'IndexProduct')
  async indexProduct(data: any): Promise<any> {
    try {
      this.logger.log(`Indexing product: ${data.id}`);

      const command = new IndexProductCommand(
        data.id,
        data.name,
        data.description || '',
        data.price || 0,
        data.category_id || '',
        data.category_name || '',
        data.image_urls || [],
        this.mapAttributes(data.attributes),
        data.created_at || new Date().toISOString(),
        data.updated_at || new Date().toISOString()
      );

      await this.commandBus.execute(command);

      return { success: true, message: 'Product indexed successfully' };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('SearchService', 'DeleteProduct')
  async deleteProduct(data: any): Promise<any> {
    try {
      this.logger.log(`Deleting product from index: ${data.product_id}`);

      const command = new DeleteProductCommand(data.product_id);
      await this.commandBus.execute(command);

      return { success: true, message: 'Product deleted from index' };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('SearchService', 'ReindexAll')
  async reindexAll(data: any): Promise<any> {
    try {
      this.logger.log(`Reindex request (force: ${data.force})`);

      const command = new ReindexAllCommand(data.force || false);
      const result: ReindexResult = await this.commandBus.execute(command);

      return {
        success: result.success,
        message: result.message,
        indexed_count: result.indexedCount,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('SearchService', 'GetIndexStats')
  async getIndexStats(_data: any): Promise<any> {
    try {
      const query = new GetIndexStatsQuery();
      const stats: IndexStats = await this.queryBus.execute(query);

      return {
        index_name: stats.indexName,
        document_count: stats.documentCount,
        size_bytes: stats.sizeBytes,
        health: stats.health,
        last_updated: stats.lastUpdated.toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ============================================
  // Mappers
  // ============================================

  private toSearchResponse(result: SearchResult): any {
    return {
      products: result.hits.map((hit) => ({
        id: hit.product.id,
        name: hit.product.name,
        description: hit.product.description,
        price: hit.product.price,
        category_id: hit.product.categoryId,
        category_name: hit.product.categoryName,
        image_urls: hit.product.imageUrls,
        attributes: hit.product.attributes.map((a) => ({
          key: a.key,
          value: a.value,
        })),
        score: hit.score,
        highlights: hit.highlights,
        created_at: hit.product.createdAt.toISOString(),
        updated_at: hit.product.updatedAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      total_pages: result.totalPages,
      facets: result.facets.map((f) => ({
        field: f.field,
        buckets: f.buckets.map((b) => ({
          key: b.key,
          count: b.count,
        })),
      })),
      took_ms: result.tookMs,
    };
  }

  private mapFacets(facets: any[]): Array<{ field: string; values: string[] }> {
    if (!facets || !Array.isArray(facets)) return [];
    return facets.map((f) => ({
      field: f.field || '',
      values: f.values || [],
    }));
  }

  private mapAttributes(attributes: any[]): Array<{ key: string; value: string }> {
    if (!attributes || !Array.isArray(attributes)) return [];
    return attributes.map((a) => ({
      key: a.key || '',
      value: a.value || '',
    }));
  }

  private handleError(error: unknown): never {
    this.logger.error('Error occurred:', error);

    if (error instanceof Error) {
      throw new RpcException({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }

    throw new RpcException({
      code: grpc.status.INTERNAL,
      message: 'Unknown error',
    });
  }
}
