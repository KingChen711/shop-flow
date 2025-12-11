import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListProductsQuery } from '../list-products.query';
import { Product } from '../../../domain/entities/product.entity';
import {
  IProductRepository,
  ProductFilters,
} from '../../../domain/repositories/product.repository.interface';

export interface ListProductsResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@QueryHandler(ListProductsQuery)
export class ListProductsHandler implements IQueryHandler<ListProductsQuery> {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: IProductRepository
  ) {}

  async execute(query: ListProductsQuery): Promise<ListProductsResult> {
    const { page, limit, categoryId, search, minPrice, maxPrice, sortBy, sortOrder } = query;

    const filters: ProductFilters = {
      isActive: true, // Only show active products by default
    };

    if (categoryId) {
      filters.categoryId = categoryId;
    }
    if (search) {
      filters.search = search;
    }
    if (minPrice !== undefined) {
      filters.minPrice = minPrice;
    }
    if (maxPrice !== undefined) {
      filters.maxPrice = maxPrice;
    }

    const { products, total } = await this.productRepository.findAll({
      page,
      limit,
      filters,
      sortBy,
      sortOrder,
    });

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
