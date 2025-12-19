import { Controller, Get, Query, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { SEARCH_SERVICE } from '@grpc/grpc-clients.module';
import { Public } from '@common/decorators/public.decorator';
import {
  SearchProductsQueryDto,
  SuggestionsQueryDto,
  SearchProductsResponseDto,
  SuggestionsResponseDto,
} from './dto/search.dto';

interface SearchServiceClient {
  SearchProducts(data: any): any;
  GetSuggestions(data: any): any;
}

@ApiTags('Search')
@Controller('search')
export class SearchController implements OnModuleInit {
  private searchService: SearchServiceClient;

  constructor(@Inject(SEARCH_SERVICE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.searchService = this.client.getService<SearchServiceClient>('SearchService');
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search products with full-text search' })
  @ApiResponse({ status: 200, type: SearchProductsResponseDto })
  async searchProducts(@Query() query: SearchProductsQueryDto): Promise<SearchProductsResponseDto> {
    const response = (await firstValueFrom(
      this.searchService.SearchProducts({
        query: query.q || '',
        category_ids: query.categoryIds || [],
        min_price: query.minPrice,
        max_price: query.maxPrice,
        sort_by: query.sortBy,
        page: query.page,
        limit: query.limit,
      })
    )) as any;

    return {
      products: (response.products || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.category_id,
        categoryName: product.category_name,
        imageUrls: product.image_urls || [],
        attributes: (product.attributes || []).map((a: any) => ({ key: a.key, value: a.value })),
        score: product.score,
        highlights: product.highlights || [],
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      })),
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.total_pages,
      facets: (response.facets || []).map((facet: any) => ({
        field: facet.field,
        buckets: (facet.buckets || []).map((b: any) => ({
          key: b.key,
          count: Number(b.count),
        })),
      })),
      tookMs: Number(response.took_ms),
    };
  }

  @Public()
  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions (autocomplete)' })
  @ApiResponse({ status: 200, type: SuggestionsResponseDto })
  async getSuggestions(@Query() query: SuggestionsQueryDto): Promise<SuggestionsResponseDto> {
    const response = (await firstValueFrom(
      this.searchService.GetSuggestions({
        prefix: query.prefix,
        limit: query.limit,
      })
    )) as any;

    return {
      suggestions: (response.suggestions || []).map((s: any) => ({
        text: s.text,
        type: s.type,
        productId: s.product_id || undefined,
      })),
    };
  }
}
