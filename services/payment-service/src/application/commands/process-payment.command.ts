import { PaymentMethod } from '@domain/entities/payment.entity';

export class ProcessPaymentCommand {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly paymentMethod: PaymentMethod,
    public readonly idempotencyKey: string,
    public readonly paymentDetails?: Record<string, string>
  ) {}
}
