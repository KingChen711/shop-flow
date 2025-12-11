import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure
import { ProductEntity } from '@infrastructure/persistence/entities/product.entity';
import { ProductRepositoryImpl } from '@infrastructure/persistence/repositories/product.repository';

// Application - Command Handlers
import { CreateProductHandler } from '@application/commands/handlers/create-product.handler';
import { UpdateProductHandler } from '@application/commands/handlers/update-product.handler';
import { DeleteProductHandler } from '@application/commands/handlers/delete-product.handler';

// Application - Query Handlers
import { GetProductHandler } from '@application/queries/handlers/get-product.handler';
import { ListProductsHandler } from '@application/queries/handlers/list-products.handler';

// Presentation
import { ProductGrpcController } from '@presentation/grpc/product.controller';

// Outbox
import { OutboxModule } from '@infrastructure/outbox/outbox.module';

// MinIO
import { MinioModule } from '@infrastructure/minio/minio.module';
import { CategoryModule } from './category.module';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { DatabaseModule } from '@infrastructure/persistence/database.module';

const CommandHandlers = [CreateProductHandler, UpdateProductHandler, DeleteProductHandler];
const QueryHandlers = [GetProductHandler, ListProductsHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([ProductEntity]),
    OutboxModule,
    MinioModule,
    CategoryModule,
    RedisModule,
    DatabaseModule,
  ],
  controllers: [ProductGrpcController],
  providers: [
    // Repository
    {
      provide: 'ProductRepository',
      useClass: ProductRepositoryImpl,
    },
    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: ['ProductRepository'],
})
export class ProductModule {}
