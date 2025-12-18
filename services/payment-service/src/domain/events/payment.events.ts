import { PaymentStatus } from '../entities/payment.entity';

// Payment Processed Event
export class PaymentProcessedEvent {
  readonly eventType = 'payment.processed';
  readonly timestamp = new Date();

  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly status: PaymentStatus,
    public readonly transactionId?: string
  ) {}
}

// Payment Failed Event
export class PaymentFailedEvent {
  readonly eventType = 'payment.failed';
  readonly timestamp = new Date();

  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly errorMessage: string
  ) {}
}

// Payment Refunded Event
export class PaymentRefundedEvent {
  readonly eventType = 'payment.refunded';
  readonly timestamp = new Date();

  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly refundAmount: number,
    public readonly reason: string
  ) {}
}
