import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

// gRPC Client tokens
export const USER_SERVICE = 'USER_SERVICE';
export const PRODUCT_SERVICE = 'PRODUCT_SERVICE';
export const ORDER_SERVICE = 'ORDER_SERVICE';
export const CART_SERVICE = 'CART_SERVICE';
export const SEARCH_SERVICE = 'SEARCH_SERVICE';

const grpcLoaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: USER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'user',
            protoPath: join(__dirname, '../../../../packages/proto/user/user.proto'),
            url: configService.get('USER_SERVICE_URL', 'localhost:50051'),
            loader: grpcLoaderOptions,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: PRODUCT_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'product',
            protoPath: join(__dirname, '../../../../packages/proto/product/product.proto'),
            url: configService.get('PRODUCT_SERVICE_URL', 'localhost:50052'),
            loader: grpcLoaderOptions,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: ORDER_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'order',
            protoPath: join(__dirname, '../../../../packages/proto/order/order.proto'),
            url: configService.get('ORDER_SERVICE_URL', 'localhost:50053'),
            loader: grpcLoaderOptions,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: CART_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'cart',
            protoPath: join(__dirname, '../../../../packages/proto/cart/cart.proto'),
            url: configService.get('CART_SERVICE_URL', 'localhost:50058'),
            loader: grpcLoaderOptions,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: SEARCH_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'search',
            protoPath: join(__dirname, '../../../../packages/proto/search/search.proto'),
            url: configService.get('SEARCH_SERVICE_URL', 'localhost:50057'),
            loader: grpcLoaderOptions,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class GrpcClientsModule {}
