import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '@grpc/grpc-clients.module';
import { CartController } from './cart.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [CartController],
})
export class CartModule {}
