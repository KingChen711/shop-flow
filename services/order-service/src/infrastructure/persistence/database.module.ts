import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { SagaStateEntity } from './entities/saga-state.entity';
import { OutboxEntity } from './entities/outbox.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const username = configService.get('DB_USERNAME');
        const password = configService.get('DB_PASSWORD');

        if (!username) {
          throw new Error('DB_USERNAME environment variable is required');
        }
        if (!password) {
          throw new Error('DB_PASSWORD environment variable is required');
        }

        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get('DB_PORT', 5434),
          username,
          password,
          database: configService.get('DB_DATABASE', 'order_db'),
          entities: [OrderEntity, OrderItemEntity, SagaStateEntity, OutboxEntity],
          synchronize: true, // Only for development
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
