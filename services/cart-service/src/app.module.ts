import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

// Infrastructure Modules
import { RedisModule } from './infrastructure/redis/redis.module';

// Domain Modules
import { CartModule } from './domain/cart.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // CQRS Support
    CqrsModule,

    // Infrastructure
    RedisModule,

    // Domain Modules
    CartModule,
  ],
})
export class AppModule {}
