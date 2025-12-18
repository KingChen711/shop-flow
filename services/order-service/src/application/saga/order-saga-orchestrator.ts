import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { Order } from '@domain/entities/order.entity';
import { SagaState, SagaStep } from '@domain/entities/saga-state.entity';
import { IOrderRepository } from '@domain/repositories/order.repository.interface';
import { ISagaStateRepository } from '@domain/repositories/saga-state.repository.interface';
import { InventoryGrpcClient } from '@infrastructure/grpc/inventory-grpc.client';
import { PaymentGrpcClient } from '@infrastructure/grpc/payment-grpc.client';
import { SagaStartedEvent, SagaCompletedEvent, SagaFailedEvent } from '@domain/events/order.events';
import { OrderEntity } from '@infrastructure/persistence/entities/order.entity';
import { SagaStateEntity } from '@infrastructure/persistence/entities/saga-state.entity';

const DEFAULT_TTL_MINUTES = 15;

@Injectable()
export class OrderSagaOrchestrator {
  private readonly logger = new Logger(OrderSagaOrchestrator.name);

  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('SagaStateRepository')
    private readonly sagaStateRepository: ISagaStateRepository,
    private readonly inventoryClient: InventoryGrpcClient,
    private readonly paymentClient: PaymentGrpcClient,
    private readonly eventBus: EventBus,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Start the order saga orchestration
   *
   * Flow:
   * 1. Create Order (done by CreateOrderHandler)
   * 2. Reserve Inventory
   * 3. Process Payment
   * 4. Confirm Order
   *
   * If any step fails, compensate in reverse order
   */
  async startSaga(order: Order): Promise<void> {
    this.logger.log(`Starting saga for order ${order.id}`);

    // Create saga state
    const sagaState = SagaState.create(order.id);
    await this.sagaStateRepository.save(sagaState);

    // Publish saga started event
    this.eventBus.publish(new SagaStartedEvent(sagaState.id, order.id));

    try {
      // Step 1: Reserve inventory
      await this.reserveInventory(order, sagaState);

      // Step 2: Process payment
      await this.processPayment(order, sagaState);

      // Step 3: Confirm order
      await this.confirmOrder(order, sagaState);

      // Mark saga as completed
      sagaState.markCompleted();
      await this.sagaStateRepository.update(sagaState);

      this.eventBus.publish(new SagaCompletedEvent(sagaState.id, order.id));
      this.logger.log(`Saga completed successfully for order ${order.id}`);
    } catch (error) {
      this.logger.error(`Saga failed for order ${order.id}:`, error);

      // Start compensation
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.compensate(order, sagaState, errorMessage);
    }
  }

  /**
   * Step 1: Reserve inventory for all order items
   */
  private async reserveInventory(order: Order, sagaState: SagaState): Promise<void> {
    this.logger.log(`Reserving inventory for order ${order.id}`);

    const items = order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const result = await this.inventoryClient.reserveMultipleStock(
      order.id,
      items,
      DEFAULT_TTL_MINUTES
    );

    if (!result.success) {
      throw new Error(`Failed to reserve inventory: ${result.errorMessage}`);
    }

    // Update saga state with reservation IDs
    const reservationIds = result.reservations.map((r) => r.id);
    sagaState.markInventoryReserved(reservationIds);
    await this.sagaStateRepository.update(sagaState);

    this.logger.log(`Inventory reserved for order ${order.id}: ${reservationIds.length} items`);
  }

  /**
   * Step 2: Process payment
   */
  private async processPayment(order: Order, sagaState: SagaState): Promise<void> {
    this.logger.log(`Processing payment for order ${order.id}`);

    const payment = await this.paymentClient.processPayment({
      orderId: order.id,
      userId: order.userId,
      amount: order.totalAmount,
      currency: 'USD',
      paymentMethod: 'CREDIT_CARD',
      idempotencyKey: `order-${order.id}`,
    });

    if (payment.status === 'FAILED') {
      throw new Error(`Payment failed: ${payment.errorMessage}`);
    }

    // Update saga state with payment ID
    sagaState.markPaymentProcessed(payment.id);
    await this.sagaStateRepository.update(sagaState);

    this.logger.log(`Payment processed for order ${order.id}: ${payment.id}`);
  }

  /**
   * Step 3: Confirm order and inventory reservations
   */
  private async confirmOrder(order: Order, sagaState: SagaState): Promise<void> {
    this.logger.log(`Confirming order ${order.id}`);

    // Confirm inventory reservations
    for (const reservationId of sagaState.reservationIds) {
      await this.inventoryClient.confirmReservation(reservationId);
    }

    // Confirm order status
    order.confirm();

    // Update order in database
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderEntity = this.toOrderEntity(order);
      await queryRunner.manager.save(OrderEntity, orderEntity);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    this.logger.log(`Order confirmed: ${order.id}`);
  }

  /**
   * Compensation: Rollback completed steps in reverse order
   */
  private async compensate(
    order: Order,
    sagaState: SagaState,
    errorMessage: string
  ): Promise<void> {
    this.logger.log(`Starting compensation for order ${order.id}`);

    sagaState.startCompensation(errorMessage);
    await this.sagaStateRepository.update(sagaState);

    try {
      // Refund payment if processed
      if (sagaState.needsPaymentRefund() && sagaState.paymentId) {
        this.logger.log(`Refunding payment for order ${order.id}`);
        try {
          await this.paymentClient.refundPayment(sagaState.paymentId, errorMessage);
          sagaState.markCompensationStepDone(SagaStep.REFUND_PAYMENT);
          await this.sagaStateRepository.update(sagaState);
        } catch (refundError) {
          this.logger.error(`Failed to refund payment for order ${order.id}:`, refundError);
        }
      }

      // Release inventory if reserved
      if (sagaState.needsInventoryRelease() && sagaState.reservationIds.length > 0) {
        this.logger.log(`Releasing inventory for order ${order.id}`);
        try {
          await this.inventoryClient.releaseMultipleStock(
            order.id,
            sagaState.reservationIds,
            errorMessage
          );
          sagaState.markCompensationStepDone(SagaStep.RELEASE_INVENTORY);
          await this.sagaStateRepository.update(sagaState);
        } catch (releaseError) {
          this.logger.error(`Failed to release inventory for order ${order.id}:`, releaseError);
        }
      }

      // Fail the order
      order.fail(errorMessage);

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const orderEntity = this.toOrderEntity(order);
        await queryRunner.manager.save(OrderEntity, orderEntity);
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

      sagaState.markCompensationStepDone(SagaStep.CANCEL_ORDER);
      sagaState.markFailed(errorMessage);
      await this.sagaStateRepository.update(sagaState);

      this.eventBus.publish(new SagaFailedEvent(sagaState.id, order.id, errorMessage));
      this.logger.log(`Compensation completed for order ${order.id}`);
    } catch (compensationError) {
      this.logger.error(`Compensation failed for order ${order.id}:`, compensationError);
      const errorMsg =
        compensationError instanceof Error ? compensationError.message : 'Unknown error';
      sagaState.markFailed(`Compensation failed: ${errorMsg}`);
      await this.sagaStateRepository.update(sagaState);
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
