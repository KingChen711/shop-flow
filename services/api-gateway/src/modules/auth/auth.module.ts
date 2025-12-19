import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '@grpc/grpc-clients.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [AuthController],
})
export class AuthModule {}
