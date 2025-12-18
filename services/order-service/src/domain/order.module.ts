import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Infrastructure
import { OrderEntity } from '@infrastructure/persistence/entities/order.entity';
import { OrderItemEntity } from '@infrastructure/persistence/entities/order-item.entity';
import { SagaStateEntity } from '@infrastructure/persistence/entities/saga-state.entity';
import { OutboxEntity } from '@infrastructure/persistence/entities/outbox.entity';
import { OrderRepositoryImpl } from '@infrastructure/persistence/repositories/order.repository';
import { SagaStateRepositoryImpl } from '@infrastructure/persistence/repositories/saga-state.repository';

// Application - Command Handlers
import { CreateOrderHandler } from '@application/commands/handlers/create-order.handler';
import { CancelOrderHandler } from '@application/commands/handlers/cancel-order.handler';
import { ConfirmOrderHandler } from '@application/commands/handlers/confirm-order.handler';
import { FailOrderHandler } from '@application/commands/handlers/fail-order.handler';

// Application - Query Handlers
import { GetOrderHandler } from '@application/queries/handlers/get-order.handler';
import { ListOrdersHandler } from '@application/queries/handlers/list-orders.handler';
import { GetOrderStatusHandler } from '@application/queries/handlers/get-order-status.handler';

// Application - Saga
import { OrderSagaOrchestrator } from '@application/saga/order-saga-orchestrator';

// Infrastructure - gRPC Clients
import { InventoryGrpcClient } from '@infrastructure/grpc/inventory-grpc.client';
import { PaymentGrpcClient } from '@infrastructure/grpc/payment-grpc.client';
import { ProductGrpcClient } from '@infrastructure/grpc/product-grpc.client';

// Infrastructure - Outbox
import { OutboxService } from '@infrastructure/outbox/outbox.service';
import { OutboxProcessor } from '@infrastructure/outbox/outbox.processor';

// Presentation
import { OrderGrpcController } from '@presentation/grpc/order.controller';

const CommandHandlers = [
  CreateOrderHandler,
  CancelOrderHandler,
  ConfirmOrderHandler,
  FailOrderHandler,
];

const QueryHandlers = [GetOrderHandler, ListOrdersHandler, GetOrderStatusHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, SagaStateEntity, OutboxEntity]),
  ],
  controllers: [OrderGrpcController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    OrderSagaOrchestrator,
    InventoryGrpcClient,
    PaymentGrpcClient,
    ProductGrpcClient,
    OutboxService,
    OutboxProcessor,
    {
      provide: 'OrderRepository',
      useClass: OrderRepositoryImpl,
    },
    {
      provide: 'SagaStateRepository',
      useClass: SagaStateRepositoryImpl,
    },
  ],
  exports: ['OrderRepository', 'SagaStateRepository'],
})
export class OrderModule {}
