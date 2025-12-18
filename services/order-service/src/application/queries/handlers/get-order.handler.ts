import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetOrderQuery } from '../get-order.query';
import { Order } from '@domain/entities/order.entity';
import { IOrderRepository } from '@domain/repositories/order.repository.interface';
import { NotFoundError } from '@shopflow/shared-utils';

@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery> {
  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(query: GetOrderQuery): Promise<Order> {
    const order = await this.orderRepository.findById(query.orderId);

    if (!order) {
      throw new NotFoundError(`Order not found: ${query.orderId}`);
    }

    return order;
  }
}
