import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentEntity } from './entities/payment.entity';

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
          port: configService.get('DB_PORT', 5436),
          username,
          password,
          database: configService.get('DB_DATABASE', 'payment_db'),
          entities: [PaymentEntity],
          synchronize: true, // Only for development
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
