import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const username = configService.get('DATABASE_USER');
        const password = configService.get('DATABASE_PASSWORD');

        if (!username) {
          throw new Error('DATABASE_USER environment variable is required');
        }
        if (!password) {
          throw new Error('DATABASE_PASSWORD environment variable is required');
        }

        return {
          type: 'postgres',
          host: configService.get('DATABASE_HOST', 'localhost'),
          port: configService.get('DATABASE_PORT', 5433), // Product DB on port 5433
          username,
          password,
          database: configService.get('DATABASE_NAME', 'product_db'),
          entities: [__dirname + '/entities/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') !== 'production',
          logging: configService.get('DATABASE_LOGGING', 'false') === 'true',
          ssl:
            configService.get('DATABASE_SSL', 'false') === 'true'
              ? { rejectUnauthorized: false }
              : false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
