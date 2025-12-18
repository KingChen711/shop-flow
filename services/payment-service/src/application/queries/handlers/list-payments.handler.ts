import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListPaymentsQuery } from '../list-payments.query';
import { Payment } from '@domain/entities/payment.entity';
import { IPaymentRepository } from '@domain/repositories/payment.repository.interface';

export interface ListPaymentsResult {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@QueryHandler(ListPaymentsQuery)
export class ListPaymentsHandler implements IQueryHandler<ListPaymentsQuery> {
  constructor(
    @Inject('PaymentRepository')
    private readonly paymentRepository: IPaymentRepository
  ) {}

  async execute(query: ListPaymentsQuery): Promise<ListPaymentsResult> {
    const { userId, page, limit, status } = query;

    const [payments, total] = await Promise.all([
      this.paymentRepository.findByUserId(userId, page, limit, status),
      this.paymentRepository.countByUserId(userId, status),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      payments,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
