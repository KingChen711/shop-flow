import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, Min, IsInt, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class KeyValueDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  value: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Gaming Laptop' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'High-performance gaming laptop' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1999.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'uuid-category-id' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  imageUrls?: string[];

  @ApiPropertyOptional({ type: [KeyValueDto] })
  @IsOptional()
  @IsArray()
  attributes?: KeyValueDto[];
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Updated Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 2499.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  imageUrls?: string[];

  @ApiPropertyOptional({ type: [KeyValueDto] })
  @IsOptional()
  @IsArray()
  attributes?: KeyValueDto[];
}

export class ListProductsQueryDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ['name', 'price', 'created_at'] })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: string;
}

export class ProductResponseDto {
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

  @ApiProperty({ type: [KeyValueDto] })
  attributes: KeyValueDto[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class ListProductsResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  products: ProductResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// Category DTOs
export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Electronic devices and gadgets' })
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiProperty()
  createdAt: string;
}

export class ListCategoriesResponseDto {
  @ApiProperty({ type: [CategoryResponseDto] })
  categories: CategoryResponseDto[];
}
