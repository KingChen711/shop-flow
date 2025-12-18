import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetPaymentByOrderQuery } from '../get-payment-by-order.query';
import { Payment } from '@domain/entities/payment.entity';
import { IPaymentRepository } from '@domain/repositories/payment.repository.interface';
import { NotFoundError } from '@shopflow/shared-utils';

@QueryHandler(GetPaymentByOrderQuery)
export class GetPaymentByOrderHandler implements IQueryHandler<GetPaymentByOrderQuery> {
  constructor(
    @Inject('PaymentRepository')
    private readonly paymentRepository: IPaymentRepository
  ) {}

  async execute(query: GetPaymentByOrderQuery): Promise<Payment> {
    const payment = await this.paymentRepository.findByOrderId(query.orderId);

    if (!payment) {
      throw new NotFoundError(`Payment not found for order: ${query.orderId}`);
    }

    return payment;
  }
}
