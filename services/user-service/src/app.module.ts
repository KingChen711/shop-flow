import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

// Infrastructure Modules
import { DatabaseModule } from './infrastructure/persistence/database.module';
import { KafkaModule } from './infrastructure/kafka/kafka.module';
import { RedisModule } from './infrastructure/redis/redis.module';

// Domain & Application
import { UserModule } from './domain/user.module';

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
    DatabaseModule,
    KafkaModule,
    RedisModule,

    // Domain Modules
    UserModule,
  ],
})
export class AppModule {}
