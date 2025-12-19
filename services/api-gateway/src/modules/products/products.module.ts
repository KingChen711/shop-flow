import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '@grpc/grpc-clients.module';
import { ProductsController, CategoriesController } from './products.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [ProductsController, CategoriesController],
})
export class ProductsModule {}
