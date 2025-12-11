import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError } from '@shopflow/shared-utils';
import { GetProductQuery } from '../get-product.query';
import { Product } from '../../../domain/entities/product.entity';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { RedisService } from '../../../infrastructure/redis/redis.service';

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: IProductRepository,
    private readonly redisService: RedisService
  ) {}

  async execute(query: GetProductQuery): Promise<Product> {
    const cacheKey = this.redisService.getProductCacheKey(query.productId);

    // Try to get from cache first
    const cached = await this.redisService.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      return Product.reconstitute({
        id: cached.id as string,
        name: cached.name as string,
        description: cached.description as string,
        price: cached.price as number,
        categoryId: cached.categoryId as string,
        imageUrls: cached.imageUrls as string[],
        attributes: cached.attributes as Record<string, string>,
        isActive: cached.isActive as boolean,
        createdAt: new Date(cached.createdAt as string),
        updatedAt: new Date(cached.updatedAt as string),
      });
    }

    // Get from database
    const product = await this.productRepository.findById(query.productId);

    if (!product) {
      throw new NotFoundError('Product', query.productId);
    }

    // Cache the result
    await this.redisService.set(cacheKey, product.toJSON(), 300 * 1000); // 5 minutes

    return product;
  }
}
