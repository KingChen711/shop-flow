import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// gRPC Clients
import { GrpcClientsModule } from '@grpc/grpc-clients.module';

// Common
import { GrpcExceptionFilter } from '@common/filters/grpc-exception.filter';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

// Modules
import { HealthModule } from '@modules/health/health.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ProductsModule } from '@modules/products/products.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { CartModule } from '@modules/cart/cart.module';
import { SearchModule } from '@modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // gRPC Clients for all backend services
    GrpcClientsModule,

    // Feature modules
    HealthModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    CartModule,
    SearchModule,
  ],
  providers: [
    // Global exception filter for gRPC errors
    {
      provide: APP_FILTER,
      useClass: GrpcExceptionFilter,
    },
    // Global authentication guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
