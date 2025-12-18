import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IOrderRepository } from '@domain/repositories/order.repository.interface';
import { Order, OrderStatus } from '@domain/entities/order.entity';
import { OrderItem } from '@domain/entities/order-item.entity';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';

@Injectable()
export class OrderRepositoryImpl implements IOrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly itemRepository: Repository<OrderItemEntity>
  ) {}

  async findById(id: string): Promise<Order | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['items'],
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number,
    status?: OrderStatus
  ): Promise<Order[]> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    const entities = await queryBuilder.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async countByUserId(userId: string, status?: OrderStatus): Promise<number> {
    const queryBuilder = this.repository
      .createQueryBuilder('order')
      .where('order.userId = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    return queryBuilder.getCount();
  }

  async save(order: Order): Promise<Order> {
    const entity = this.toEntity(order);
    const saved = await this.repository.save(entity);

    // Save items
    for (const item of order.items) {
      const itemEntity = new OrderItemEntity();
      itemEntity.id = item.id;
      itemEntity.orderId = order.id;
      itemEntity.productId = item.productId;
      itemEntity.productName = item.productName;
      itemEntity.quantity = item.quantity;
      itemEntity.price = item.price;
      itemEntity.subtotal = item.subtotal;
      await this.itemRepository.save(itemEntity);
    }

    // Re-fetch with items
    const result = await this.findById(saved.id);
    return result!;
  }

  async update(order: Order): Promise<Order> {
    const entity = this.toEntity(order);
    await this.repository.save(entity);
    const result = await this.findById(order.id);
    return result!;
  }

  private toDomain(entity: OrderEntity): Order {
    const items = (entity.items || []).map((itemEntity) =>
      OrderItem.fromPersistence({
        id: itemEntity.id,
        orderId: itemEntity.orderId,
        productId: itemEntity.productId,
        productName: itemEntity.productName,
        quantity: itemEntity.quantity,
        price: Number(itemEntity.price),
        subtotal: Number(itemEntity.subtotal),
      })
    );

    return Order.fromPersistence({
      id: entity.id,
      userId: entity.userId,
      items,
      totalAmount: Number(entity.totalAmount),
      status: entity.status as OrderStatus,
      shippingAddress: entity.shippingAddress,
      notes: entity.notes,
      failureReason: entity.failureReason,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(order: Order): OrderEntity {
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
