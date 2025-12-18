import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPaymentRepository } from '@domain/repositories/payment.repository.interface';
import { Payment, PaymentStatus, PaymentMethod } from '@domain/entities/payment.entity';
import { PaymentEntity } from '../entities/payment.entity';

@Injectable()
export class PaymentRepositoryImpl implements IPaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly repository: Repository<PaymentEntity>
  ) {}

  async findById(id: string): Promise<Payment | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const entity = await this.repository.findOne({ where: { orderId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Payment | null> {
    const entity = await this.repository.findOne({ where: { idempotencyKey } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number,
    status?: PaymentStatus
  ): Promise<Payment[]> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('payment')
      .where('payment.userId = :userId', { userId })
      .orderBy('payment.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    const entities = await queryBuilder.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async countByUserId(userId: string, status?: PaymentStatus): Promise<number> {
    const queryBuilder = this.repository
      .createQueryBuilder('payment')
      .where('payment.userId = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    return queryBuilder.getCount();
  }

  async save(payment: Payment): Promise<Payment> {
    const entity = this.toEntity(payment);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(payment: Payment): Promise<Payment> {
    const entity = this.toEntity(payment);
    await this.repository.save(entity);
    const result = await this.findById(payment.id);
    return result!;
  }

  private toDomain(entity: PaymentEntity): Payment {
    return Payment.fromPersistence({
      id: entity.id,
      orderId: entity.orderId,
      userId: entity.userId,
      amount: Number(entity.amount),
      currency: entity.currency,
      status: entity.status as PaymentStatus,
      paymentMethod: entity.paymentMethod as PaymentMethod,
      transactionId: entity.transactionId,
      errorMessage: entity.errorMessage,
      refundedAmount: Number(entity.refundedAmount),
      idempotencyKey: entity.idempotencyKey,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(payment: Payment): PaymentEntity {
    const entity = new PaymentEntity();
    entity.id = payment.id;
    entity.orderId = payment.orderId;
    entity.userId = payment.userId;
    entity.amount = payment.amount;
    entity.currency = payment.currency;
    entity.status = payment.status;
    entity.paymentMethod = payment.paymentMethod;
    entity.transactionId = payment.transactionId;
    entity.errorMessage = payment.errorMessage;
    entity.refundedAmount = payment.refundedAmount;
    entity.idempotencyKey = payment.idempotencyKey;
    entity.createdAt = payment.createdAt;
    entity.updatedAt = payment.updatedAt;
    return entity;
  }
}
