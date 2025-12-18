import { Payment, PaymentStatus } from '../entities/payment.entity';

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<Payment | null>;
  findByUserId(
    userId: string,
    page: number,
    limit: number,
    status?: PaymentStatus
  ): Promise<Payment[]>;
  countByUserId(userId: string, status?: PaymentStatus): Promise<number>;
  save(payment: Payment): Promise<Payment>;
  update(payment: Payment): Promise<Payment>;
}
