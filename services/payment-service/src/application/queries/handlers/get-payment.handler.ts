import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetPaymentQuery } from '../get-payment.query';
import { Payment } from '@domain/entities/payment.entity';
import { IPaymentRepository } from '@domain/repositories/payment.repository.interface';
import { NotFoundError } from '@shopflow/shared-utils';

@QueryHandler(GetPaymentQuery)
export class GetPaymentHandler implements IQueryHandler<GetPaymentQuery> {
  constructor(
    @Inject('PaymentRepository')
    private readonly paymentRepository: IPaymentRepository
  ) {}

  async execute(query: GetPaymentQuery): Promise<Payment> {
    const payment = await this.paymentRepository.findById(query.paymentId);

    if (!payment) {
      throw new NotFoundError(`Payment not found: ${query.paymentId}`);
    }

    return payment;
  }
}
