import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Infrastructure
import { DatabaseModule } from '@infrastructure/persistence/database.module';
import { KafkaModule } from '@infrastructure/kafka/kafka.module';

// Domain
import { OrderModule } from '@domain/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    KafkaModule,
    OrderModule,
  ],
})
export class AppModule {}
