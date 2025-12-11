import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure
import { CategoryEntity } from '../infrastructure/persistence/entities/category.entity';
import { CategoryRepositoryImpl } from '../infrastructure/persistence/repositories/category.repository';
import { RedisModule } from '../infrastructure/redis/redis.module';

// Application - Command Handlers
import { CreateCategoryHandler } from '../application/commands/handlers/create-category.handler';

// Application - Query Handlers
import { GetCategoryHandler } from '../application/queries/handlers/get-category.handler';
import { ListCategoriesHandler } from '../application/queries/handlers/list-categories.handler';

// Presentation
import { CategoryGrpcController } from '../presentation/grpc/category.controller';

const CommandHandlers = [CreateCategoryHandler];
const QueryHandlers = [GetCategoryHandler, ListCategoriesHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([CategoryEntity]), RedisModule],
  controllers: [CategoryGrpcController],
  providers: [
    // Repository
    {
      provide: 'CategoryRepository',
      useClass: CategoryRepositoryImpl,
    },
    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: ['CategoryRepository'],
})
export class CategoryModule {}
