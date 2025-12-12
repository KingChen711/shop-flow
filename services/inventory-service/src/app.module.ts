import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

// Infrastructure Modules
import { DatabaseModule } from '@infrastructure/persistence/database.module';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { DistributedLockModule } from '@infrastructure/redis/distributed-lock.module';
import { KafkaModule } from '@infrastructure/kafka/kafka.module';
import { SchedulerModule } from '@infrastructure/scheduler/scheduler.module';

// Domain Modules
import { InventoryModule } from '@domain/inventory.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // CQRS
    CqrsModule,

    // Infrastructure
    DatabaseModule,
    RedisModule,
    DistributedLockModule,
    KafkaModule,
    SchedulerModule,

    // Domain
    InventoryModule,
  ],
})
export class AppModule {}
