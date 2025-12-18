import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListOrdersQuery } from '../list-orders.query';
import { Order } from '@domain/entities/order.entity';
import { IOrderRepository } from '@domain/repositories/order.repository.interface';

export interface ListOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@QueryHandler(ListOrdersQuery)
export class ListOrdersHandler implements IQueryHandler<ListOrdersQuery> {
  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(query: ListOrdersQuery): Promise<ListOrdersResult> {
    const { userId, page, limit, status } = query;

    const [orders, total] = await Promise.all([
      this.orderRepository.findByUserId(userId, page, limit, status),
      this.orderRepository.countByUserId(userId, status),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
