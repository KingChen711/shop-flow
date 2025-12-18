import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CancelOrderCommand } from '../cancel-order.command';
import { Order, OrderStatus } from '@domain/entities/order.entity';
import { IOrderRepository } from '@domain/repositories/order.repository.interface';
import { ISagaStateRepository } from '@domain/repositories/saga-state.repository.interface';
import { SagaStatus } from '@domain/entities/saga-state.entity';
import { OrderCancelledEvent } from '@domain/events/order.events';
import { InventoryGrpcClient } from '@infrastructure/grpc/inventory-grpc.client';
import { PaymentGrpcClient } from '@infrastructure/grpc/payment-grpc.client';
import { OutboxService } from '@infrastructure/outbox/outbox.service';
import { OrderEntity } from '@infrastructure/persistence/entities/order.entity';
import { NotFoundError, ConflictError } from '@shopflow/shared-utils';

@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<CancelOrderCommand> {
  private readonly logger = new Logger(CancelOrderHandler.name);

  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('SagaStateRepository')
    private readonly sagaStateRepository: ISagaStateRepository,
    private readonly inventoryClient: InventoryGrpcClient,
    private readonly paymentClient: PaymentGrpcClient,
    private readonly outboxService: OutboxService,
    private readonly eventBus: EventBus,
    private readonly dataSource: DataSource
  ) {}

  async execute(command: CancelOrderCommand): Promise<Order> {
    const { orderId, reason } = command;

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order not found: ${orderId}`);
    }

    if (!order.canCancel()) {
      throw new ConflictError(`Cannot cancel order in status: ${order.status}`);
    }

    // Get saga state to know what compensations are needed
    const sagaState = await this.sagaStateRepository.findByOrderId(orderId);

    // Perform compensations based on order status
    try {
      const isOrderConfirmedOrBeyond = [
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
      ].includes(order.status);

      const isSagaCompleted = sagaState?.status === SagaStatus.COMPLETED;

      if (isOrderConfirmedOrBeyond || isSagaCompleted) {
        // Order was CONFIRMED = inventory was consumed (reservations confirmed)
        // We need to RESTOCK the items (add stock back)
        this.logger.log(`Restocking inventory for cancelled CONFIRMED order ${orderId}`);
        const itemsToRestock = order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));
        await this.inventoryClient.restockItems(itemsToRestock, `Order cancelled: ${reason}`);
      } else if (sagaState?.hasReservations()) {
        // Order is still PENDING = reservations are still pending
        // We need to RELEASE the reservations
        this.logger.log(`Releasing pending reservations for order ${orderId}`);
        await this.inventoryClient.releaseMultipleStock(orderId, sagaState.reservationIds, reason);
      }

      // Refund payment if processed
      if (sagaState?.hasPayment() && sagaState.paymentId) {
        this.logger.log(`Refunding payment for order ${orderId}`);
        await this.paymentClient.refundPayment(sagaState.paymentId, reason);
      }
    } catch (error) {
      this.logger.error(`Compensation failed for order ${orderId}:`, error);
      // Continue with cancellation even if compensation fails
    }

    // Cancel the order
    order.cancel(reason);

    // Use transaction to update order and add outbox event
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update order
      const orderEntity = this.toOrderEntity(order);
      await queryRunner.manager.save(OrderEntity, orderEntity);

      // Create event
      const event = new OrderCancelledEvent(orderId, order.userId, reason);

      // Add to outbox
      await this.outboxService.addEvent(event, queryRunner.manager);

      await queryRunner.commitTransaction();

      // Publish internal event
      this.eventBus.publish(event);

      this.logger.log(`Order cancelled: ${orderId}, reason: ${reason}`);

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
    entity.failureReason = order.failureReason;
    entity.createdAt = order.createdAt;
    entity.updatedAt = order.updatedAt;
    return entity;
  }
}
