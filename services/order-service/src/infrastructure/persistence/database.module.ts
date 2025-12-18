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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5434),
        username: configService.get('DB_USERNAME', 'shopflow'),
        password: configService.get('DB_PASSWORD', 'shopflow123'),
        database: configService.get('DB_DATABASE', 'order_db'),
        entities: [OrderEntity, OrderItemEntity, SagaStateEntity, OutboxEntity],
        synchronize: true, // Only for development
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
