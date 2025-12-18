import { PaymentStatus } from '@domain/entities/payment.entity';

export class ListPaymentsQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly status?: PaymentStatus
  ) {}
}
