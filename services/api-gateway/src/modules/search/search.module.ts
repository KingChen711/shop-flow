import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '@grpc/grpc-clients.module';
import { SearchController } from './search.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [SearchController],
})
export class SearchModule {}
