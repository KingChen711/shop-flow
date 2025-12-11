import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError } from '@shopflow/shared-utils';
import { GetCategoryQuery } from '../get-category.query';
import { Category } from '../../../domain/entities/category.entity';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { RedisService } from '../../../infrastructure/redis/redis.service';

@QueryHandler(GetCategoryQuery)
export class GetCategoryHandler implements IQueryHandler<GetCategoryQuery> {
  constructor(
    @Inject('CategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    private readonly redisService: RedisService
  ) {}

  async execute(query: GetCategoryQuery): Promise<Category> {
    const cacheKey = this.redisService.getCategoryCacheKey(query.categoryId);

    // Try to get from cache first
    const cached = await this.redisService.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      return Category.reconstitute({
        id: cached.id as string,
        name: cached.name as string,
        description: cached.description as string,
        parentId: cached.parentId as string | null,
        isActive: cached.isActive as boolean,
        createdAt: new Date(cached.createdAt as string),
        updatedAt: new Date(cached.updatedAt as string),
      });
    }

    // Get from database
    const category = await this.categoryRepository.findById(query.categoryId);

    if (!category) {
      throw new NotFoundError('Category', query.categoryId);
    }

    // Cache the result (10 minutes - categories change less often)
    await this.redisService.set(cacheKey, category.toJSON(), 600 * 1000);

    return category;
  }
}
