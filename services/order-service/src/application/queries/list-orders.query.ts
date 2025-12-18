import { OrderStatus } from '@domain/entities/order.entity';

export class ListOrdersQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly status?: OrderStatus
  ) {}
}
