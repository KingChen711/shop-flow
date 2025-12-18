import { v4 as uuidv4 } from 'uuid';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
}

export interface CreatePaymentProps {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
}

export interface PaymentProps {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  errorMessage?: string;
  refundedAmount: number;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  private constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly currency: string,
    private _status: PaymentStatus,
    public readonly paymentMethod: PaymentMethod,
    private _transactionId: string | undefined,
    private _errorMessage: string | undefined,
    private _refundedAmount: number,
    public readonly idempotencyKey: string,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  // Getters
  get status(): PaymentStatus {
    return this._status;
  }

  get transactionId(): string | undefined {
    return this._transactionId;
  }

  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  get refundedAmount(): number {
    return this._refundedAmount;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Factory methods
  static create(props: CreatePaymentProps): Payment {
    const id = uuidv4();
    const now = new Date();

    return new Payment(
      id,
      props.orderId,
      props.userId,
      props.amount,
      props.currency,
      PaymentStatus.PENDING,
      props.paymentMethod,
      undefined,
      undefined,
      0,
      props.idempotencyKey,
      now,
      now
    );
  }

  static fromPersistence(props: PaymentProps): Payment {
    return new Payment(
      props.id,
      props.orderId,
      props.userId,
      props.amount,
      props.currency,
      props.status,
      props.paymentMethod,
      props.transactionId,
      props.errorMessage,
      props.refundedAmount,
      props.idempotencyKey,
      props.createdAt,
      props.updatedAt
    );
  }

  // State transitions
  startProcessing(): void {
    if (this._status !== PaymentStatus.PENDING) {
      throw new Error(`Cannot start processing payment in status: ${this._status}`);
    }
    this._status = PaymentStatus.PROCESSING;
    this._updatedAt = new Date();
  }

  complete(transactionId: string): void {
    if (this._status !== PaymentStatus.PROCESSING) {
      throw new Error(`Cannot complete payment in status: ${this._status}`);
    }
    this._status = PaymentStatus.COMPLETED;
    this._transactionId = transactionId;
    this._updatedAt = new Date();
  }

  fail(errorMessage: string): void {
    if (this._status === PaymentStatus.COMPLETED || this._status === PaymentStatus.REFUNDED) {
      throw new Error(`Cannot fail payment in status: ${this._status}`);
    }
    this._status = PaymentStatus.FAILED;
    this._errorMessage = errorMessage;
    this._updatedAt = new Date();
  }

  refund(amount?: number): void {
    if (
      this._status !== PaymentStatus.COMPLETED &&
      this._status !== PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new Error(`Cannot refund payment in status: ${this._status}`);
    }

    const refundAmount = amount ?? this.amount - this._refundedAmount;
    const totalRefunded = this._refundedAmount + refundAmount;

    if (totalRefunded > this.amount) {
      throw new Error('Refund amount exceeds original payment amount');
    }

    this._refundedAmount = totalRefunded;

    if (totalRefunded >= this.amount) {
      this._status = PaymentStatus.REFUNDED;
    } else {
      this._status = PaymentStatus.PARTIALLY_REFUNDED;
    }

    this._updatedAt = new Date();
  }

  // Helpers
  canRefund(): boolean {
    return (
      this._status === PaymentStatus.COMPLETED || this._status === PaymentStatus.PARTIALLY_REFUNDED
    );
  }

  getRemainingRefundable(): number {
    return this.amount - this._refundedAmount;
  }
}
