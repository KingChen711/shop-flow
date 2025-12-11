import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListCategoriesQuery } from '../list-categories.query';
import { Category } from '../../../domain/entities/category.entity';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { RedisService } from '../../../infrastructure/redis/redis.service';

@QueryHandler(ListCategoriesQuery)
export class ListCategoriesHandler implements IQueryHandler<ListCategoriesQuery> {
  constructor(
    @Inject('CategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    private readonly redisService: RedisService
  ) {}

  async execute(query: ListCategoriesQuery): Promise<Category[]> {
    const cacheKey = `categories:list:${query.parentId ?? 'all'}`;

    // Try to get from cache first
    const cached = await this.redisService.get<Record<string, unknown>[]>(cacheKey);
    if (cached) {
      return cached.map((c) =>
        Category.reconstitute({
          id: c.id as string,
          name: c.name as string,
          description: c.description as string,
          parentId: c.parentId as string | null,
          isActive: c.isActive as boolean,
          createdAt: new Date(c.createdAt as string),
          updatedAt: new Date(c.updatedAt as string),
        })
      );
    }

    let categories: Category[];

    if (query.parentId === undefined) {
      // Return all categories
      categories = await this.categoryRepository.findAll();
    } else {
      // Return categories by parent ID (null for root categories)
      categories = await this.categoryRepository.findByParentId(query.parentId);
    }

    // Cache the result (10 minutes)
    await this.redisService.set(
      cacheKey,
      categories.map((c) => c.toJSON()),
      600 * 1000
    );

    return categories;
  }
}
