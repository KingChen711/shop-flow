import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Infrastructure
import { DatabaseModule } from '@infrastructure/persistence/database.module';

// Domain
import { PaymentModule } from '@domain/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    PaymentModule,
  ],
})
export class AppModule {}
