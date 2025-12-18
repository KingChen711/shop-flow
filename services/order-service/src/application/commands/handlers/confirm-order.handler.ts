import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfirmOrderCommand } from '../confirm-order.command';
import { Order } from '@domain/entities/order.entity';
import { IOrderRepository } from '@domain/repositories/order.repository.interface';
import { OrderConfirmedEvent } from '@domain/events/order.events';
import { OutboxService } from '@infrastructure/outbox/outbox.service';
import { OrderEntity } from '@infrastructure/persistence/entities/order.entity';
import { NotFoundError, ConflictError } from '@shopflow/shared-utils';

@CommandHandler(ConfirmOrderCommand)
export class ConfirmOrderHandler implements ICommandHandler<ConfirmOrderCommand> {
  private readonly logger = new Logger(ConfirmOrderHandler.name);

  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly outboxService: OutboxService,
    private readonly eventBus: EventBus,
    private readonly dataSource: DataSource
  ) {}

  async execute(command: ConfirmOrderCommand): Promise<Order> {
    const { orderId } = command;

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order not found: ${orderId}`);
    }

    if (!order.isPending()) {
      throw new ConflictError(`Cannot confirm order in status: ${order.status}`);
    }

    // Confirm the order
    order.confirm();

    // Use transaction to update order and add outbox event
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update order
      const orderEntity = this.toOrderEntity(order);
      await queryRunner.manager.save(OrderEntity, orderEntity);

      // Create event
      const event = new OrderConfirmedEvent(orderId, order.userId);

      // Add to outbox
      await this.outboxService.addEvent(event, queryRunner.manager);

      await queryRunner.commitTransaction();

      // Publish internal event
      this.eventBus.publish(event);

      this.logger.log(`Order confirmed: ${orderId}`);

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
