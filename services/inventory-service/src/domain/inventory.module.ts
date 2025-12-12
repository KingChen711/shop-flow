import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Infrastructure
import { RedisModule } from '@infrastructure/redis/redis.module';
import { DistributedLockModule } from '@infrastructure/redis/distributed-lock.module';
import { InventoryRepositoryImpl } from '@infrastructure/persistence/repositories/inventory.repository';
import { ReservationRepositoryImpl } from '@infrastructure/persistence/repositories/reservation.repository';

// Application - Command Handlers
import { UpdateStockHandler } from '@application/commands/handlers/update-stock.handler';
import { ReserveStockHandler } from '@application/commands/handlers/reserve-stock.handler';
import { ConfirmReservationHandler } from '@application/commands/handlers/confirm-reservation.handler';
import { ReleaseReservationHandler } from '@application/commands/handlers/release-reservation.handler';
import { ReserveMultipleStockHandler } from '@application/commands/handlers/reserve-multiple-stock.handler';
import { ReleaseMultipleStockHandler } from '@application/commands/handlers/release-multiple-stock.handler';

// Application - Query Handlers
import { GetStockHandler } from '@application/queries/handlers/get-stock.handler';
import { GetMultipleStockHandler } from '@application/queries/handlers/get-multiple-stock.handler';

// Presentation
import { InventoryGrpcController } from '@presentation/grpc/inventory.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryEntity } from '@infrastructure/persistence/entities/inventory.entity';
import { ReservationEntity } from '@infrastructure/persistence/entities/reservation.entity';

const CommandHandlers = [
  UpdateStockHandler,
  ReserveStockHandler,
  ConfirmReservationHandler,
  ReleaseReservationHandler,
  ReserveMultipleStockHandler,
  ReleaseMultipleStockHandler,
];

const QueryHandlers = [GetStockHandler, GetMultipleStockHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([InventoryEntity, ReservationEntity]),
    RedisModule,
    DistributedLockModule,
  ],
  controllers: [InventoryGrpcController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: 'InventoryRepository',
      useClass: InventoryRepositoryImpl,
    },
    {
      provide: 'ReservationRepository',
      useClass: ReservationRepositoryImpl,
    },
  ],
  exports: ['InventoryRepository', 'ReservationRepository'],
})
export class InventoryModule {}
