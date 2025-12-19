import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsNumber, Min, IsOptional, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SearchProductsQueryDto {
  @ApiPropertyOptional({ description: 'Search query string' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by category IDs (comma-separated)' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['relevance', 'price_asc', 'price_desc', 'name', 'newest'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'relevance';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class SuggestionsQueryDto {
  @ApiProperty({ description: 'Search prefix for autocomplete' })
  @IsString()
  prefix: string;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 5;
}

export class ProductAttributeDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  value: string;
}

export class ProductHitDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  categoryName: string;

  @ApiProperty({ type: [String] })
  imageUrls: string[];

  @ApiProperty({ type: [ProductAttributeDto] })
  attributes: ProductAttributeDto[];

  @ApiProperty({ description: 'Search relevance score' })
  score: number;

  @ApiProperty({ type: [String], description: 'Highlighted text snippets' })
  highlights: string[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class FacetBucketDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  count: number;
}

export class FacetResultDto {
  @ApiProperty()
  field: string;

  @ApiProperty({ type: [FacetBucketDto] })
  buckets: FacetBucketDto[];
}

export class SearchProductsResponseDto {
  @ApiProperty({ type: [ProductHitDto] })
  products: ProductHitDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty({ type: [FacetResultDto] })
  facets: FacetResultDto[];

  @ApiProperty({ description: 'Search time in milliseconds' })
  tookMs: number;
}

export class SuggestionDto {
  @ApiProperty()
  text: string;

  @ApiProperty({ enum: ['product', 'category', 'keyword'] })
  type: string;

  @ApiPropertyOptional()
  productId?: string;
}

export class SuggestionsResponseDto {
  @ApiProperty({ type: [SuggestionDto] })
  suggestions: SuggestionDto[];
}
