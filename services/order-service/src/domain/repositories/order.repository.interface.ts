import { Order, OrderStatus } from '../entities/order.entity';

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string, page: number, limit: number, status?: OrderStatus): Promise<Order[]>;
  countByUserId(userId: string, status?: OrderStatus): Promise<number>;
  save(order: Order): Promise<Order>;
  update(order: Order): Promise<Order>;
}
