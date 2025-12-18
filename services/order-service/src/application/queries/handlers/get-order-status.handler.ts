import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetOrderStatusQuery } from '../get-order-status.query';
import { Order, OrderStatus } from '@domain/entities/order.entity';
import { IOrderRepository } from '@domain/repositories/order.repository.interface';
import { NotFoundError } from '@shopflow/shared-utils';

export interface OrderStatusResult {
  orderId: string;
  status: OrderStatus;
  statusMessage: string;
  updatedAt: Date;
}

const STATUS_MESSAGES: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Your order is being processed',
  [OrderStatus.CONFIRMED]: 'Your order has been confirmed',
  [OrderStatus.PROCESSING]: 'Your order is being prepared',
  [OrderStatus.SHIPPED]: 'Your order has been shipped',
  [OrderStatus.DELIVERED]: 'Your order has been delivered',
  [OrderStatus.CANCELLED]: 'Your order has been cancelled',
  [OrderStatus.FAILED]: 'Your order failed to process',
};

@QueryHandler(GetOrderStatusQuery)
export class GetOrderStatusHandler implements IQueryHandler<GetOrderStatusQuery> {
  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(query: GetOrderStatusQuery): Promise<OrderStatusResult> {
    const order = await this.orderRepository.findById(query.orderId);

    if (!order) {
      throw new NotFoundError(`Order not found: ${query.orderId}`);
    }

    return {
      orderId: order.id,
      status: order.status,
      statusMessage: STATUS_MESSAGES[order.status],
      updatedAt: order.updatedAt,
    };
  }
}
