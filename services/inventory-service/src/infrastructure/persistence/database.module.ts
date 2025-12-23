import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InventoryEntity } from './entities/inventory.entity';
import { ReservationEntity } from './entities/reservation.entity';

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
          port: configService.get('DB_PORT', 5435),
          username,
          password,
          database: configService.get('DB_DATABASE', 'inventory_db'),
          entities: [InventoryEntity, ReservationEntity],
          synchronize: configService.get('NODE_ENV') === 'development',
          logging: configService.get('DB_LOGGING', false),
        };
      },
    }),
    TypeOrmModule.forFeature([InventoryEntity, ReservationEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
