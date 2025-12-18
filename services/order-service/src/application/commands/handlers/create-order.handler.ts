import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateOrderCommand } from '../create-order.command';
import { Order } from '@domain/entities/order.entity';
import { IOrderRepository } from '@domain/repositories/order.repository.interface';
import { OrderCreatedEvent } from '@domain/events/order.events';
import { OrderSagaOrchestrator } from '@application/saga/order-saga-orchestrator';
import { ProductGrpcClient } from '@infrastructure/grpc/product-grpc.client';
import { OutboxService } from '@infrastructure/outbox/outbox.service';
import { OrderEntity } from '@infrastructure/persistence/entities/order.entity';
import { OrderItemEntity } from '@infrastructure/persistence/entities/order-item.entity';
import { ValidationError, NotFoundError } from '@shopflow/shared-utils';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  private readonly logger = new Logger(CreateOrderHandler.name);

  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly sagaOrchestrator: OrderSagaOrchestrator,
    private readonly productClient: ProductGrpcClient,
    private readonly outboxService: OutboxService,
    private readonly eventBus: EventBus,
    private readonly dataSource: DataSource
  ) {}

  async execute(command: CreateOrderCommand): Promise<Order> {
    this.logger.log(`Creating order for user ${command.userId}`);

    const { userId, items, shippingAddress, notes } = command;

    if (!items || items.length === 0) {
      throw new ValidationError('Order must contain at least one item');
    }

    // Fetch product details for each item
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = await this.productClient.getProduct(item.productId);
        if (!product) {
          throw new NotFoundError(`Product not found: ${item.productId}`);
        }
        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          price: product.price,
        };
      })
    );

    // Create order entity
    const order = Order.create({
      userId,
      items: orderItems,
      shippingAddress,
      notes,
    });

    // Use transaction to save order and outbox event
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Save order
      const orderEntity = this.toOrderEntity(order);
      await queryRunner.manager.save(OrderEntity, orderEntity);

      // Save order items
      for (const item of order.items) {
        const itemEntity = new OrderItemEntity();
        itemEntity.id = item.id;
        itemEntity.orderId = order.id;
        itemEntity.productId = item.productId;
        itemEntity.productName = item.productName;
        itemEntity.quantity = item.quantity;
        itemEntity.price = item.price;
        itemEntity.subtotal = item.subtotal;
        await queryRunner.manager.save(OrderItemEntity, itemEntity);
      }

      // Create event for outbox
      const event = new OrderCreatedEvent(
        order.id,
        userId,
        order.totalAmount,
        order.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        }))
      );

      // Add to outbox
      await this.outboxService.addEvent(event, queryRunner.manager);

      await queryRunner.commitTransaction();

      // Publish internal event
      this.eventBus.publish(event);

      this.logger.log(`Order created: ${order.id} for user ${userId}`);

      // Start the saga orchestration (async)
      this.sagaOrchestrator.startSaga(order).catch((error) => {
        this.logger.error(`Saga failed for order ${order.id}:`, error);
      });

      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private toOrderEntity(order: Order): OrderEntity {
    const entity = new OrderEntity();
    entity.id = order.id;
    entity.userId = order.userId;
    entity.totalAmount = order.totalAmount;
    entity.status = order.status;
    entity.shippingAddress = order.shippingAddress;
    entity.notes = order.notes;
    entity.createdAt = order.createdAt;
    entity.updatedAt = order.updatedAt;
    return entity;
  }
}
