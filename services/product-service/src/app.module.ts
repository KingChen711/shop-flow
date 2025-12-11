import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';

// Infrastructure Modules
import { DatabaseModule } from './infrastructure/persistence/database.module';
import { KafkaModule } from './infrastructure/kafka/kafka.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { MinioModule } from './infrastructure/minio/minio.module';
import { OutboxModule } from './infrastructure/outbox/outbox.module';

// Domain Modules
import { ProductModule } from './domain/product.module';
import { CategoryModule } from './domain/category.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Scheduler for outbox processing
    ScheduleModule.forRoot(),

    // CQRS Support
    CqrsModule,

    // Infrastructure
    DatabaseModule,
    KafkaModule,
    RedisModule,
    MinioModule,
    OutboxModule,

    // Domain Modules
    ProductModule,
    CategoryModule,
  ],
})
export class AppModule {}
