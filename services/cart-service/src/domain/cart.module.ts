import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Infrastructure
import { RedisModule } from '@infrastructure/redis/redis.module';
import { CartRepositoryImpl } from '@infrastructure/redis/cart.repository';

// Application - Command Handlers
import { AddItemHandler } from '@application/commands/handlers/add-item.handler';
import { UpdateItemQuantityHandler } from '@application/commands/handlers/update-item-quantity.handler';
import { RemoveItemHandler } from '@application/commands/handlers/remove-item.handler';
import { ClearCartHandler } from '@application/commands/handlers/clear-cart.handler';

// Application - Query Handlers
import { GetCartHandler } from '@application/queries/handlers/get-cart.handler';
import { GetCartSummaryHandler } from '@application/queries/handlers/get-cart-summary.handler';

// Presentation
import { CartGrpcController } from '@presentation/grpc/cart.controller';

const CommandHandlers = [
  AddItemHandler,
  UpdateItemQuantityHandler,
  RemoveItemHandler,
  ClearCartHandler,
];

const QueryHandlers = [GetCartHandler, GetCartSummaryHandler];

@Module({
  imports: [CqrsModule, RedisModule],
  controllers: [CartGrpcController],
  providers: [
    // Repository
    {
      provide: 'CartRepository',
      useClass: CartRepositoryImpl,
    },
    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: ['CartRepository'],
})
export class CartModule {}
