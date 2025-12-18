import { v4 as uuidv4 } from 'uuid';

export enum SagaStatus {
  STARTED = 'STARTED',
  INVENTORY_RESERVED = 'INVENTORY_RESERVED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  COMPLETED = 'COMPLETED',
  COMPENSATING = 'COMPENSATING',
  FAILED = 'FAILED',
}

export enum SagaStep {
  CREATE_ORDER = 'CREATE_ORDER',
  RESERVE_INVENTORY = 'RESERVE_INVENTORY',
  PROCESS_PAYMENT = 'PROCESS_PAYMENT',
  CONFIRM_ORDER = 'CONFIRM_ORDER',
  // Compensation steps
  RELEASE_INVENTORY = 'RELEASE_INVENTORY',
  REFUND_PAYMENT = 'REFUND_PAYMENT',
  CANCEL_ORDER = 'CANCEL_ORDER',
}

export interface SagaStateProps {
  id: string;
  orderId: string;
  status: SagaStatus;
  currentStep: SagaStep;
  completedSteps: SagaStep[];
  reservationIds: string[];
  paymentId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SagaState {
  private constructor(
    public readonly id: string,
    public readonly orderId: string,
    private _status: SagaStatus,
    private _currentStep: SagaStep,
    private _completedSteps: SagaStep[],
    private _reservationIds: string[],
    private _paymentId: string | undefined,
    private _errorMessage: string | undefined,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  // Getters
  get status(): SagaStatus {
    return this._status;
  }

  get currentStep(): SagaStep {
    return this._currentStep;
  }

  get completedSteps(): SagaStep[] {
    return [...this._completedSteps];
  }

  get reservationIds(): string[] {
    return [...this._reservationIds];
  }

  get paymentId(): string | undefined {
    return this._paymentId;
  }

  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Factory methods
  static create(orderId: string): SagaState {
    const now = new Date();
    return new SagaState(
      uuidv4(),
      orderId,
      SagaStatus.STARTED,
      SagaStep.CREATE_ORDER,
      [SagaStep.CREATE_ORDER],
      [],
      undefined,
      undefined,
      now,
      now
    );
  }

  static fromPersistence(props: SagaStateProps): SagaState {
    return new SagaState(
      props.id,
      props.orderId,
      props.status,
      props.currentStep,
      props.completedSteps,
      props.reservationIds,
      props.paymentId,
      props.errorMessage,
      props.createdAt,
      props.updatedAt
    );
  }

  // State transitions
  markInventoryReserved(reservationIds: string[]): void {
    this._status = SagaStatus.INVENTORY_RESERVED;
    this._currentStep = SagaStep.RESERVE_INVENTORY;
    this._completedSteps.push(SagaStep.RESERVE_INVENTORY);
    this._reservationIds = reservationIds;
    this._updatedAt = new Date();
  }

  markPaymentProcessed(paymentId: string): void {
    this._status = SagaStatus.PAYMENT_PROCESSED;
    this._currentStep = SagaStep.PROCESS_PAYMENT;
    this._completedSteps.push(SagaStep.PROCESS_PAYMENT);
    this._paymentId = paymentId;
    this._updatedAt = new Date();
  }

  markCompleted(): void {
    this._status = SagaStatus.COMPLETED;
    this._currentStep = SagaStep.CONFIRM_ORDER;
    this._completedSteps.push(SagaStep.CONFIRM_ORDER);
    this._updatedAt = new Date();
  }

  startCompensation(errorMessage: string): void {
    this._status = SagaStatus.COMPENSATING;
    this._errorMessage = errorMessage;
    this._updatedAt = new Date();
  }

  markCompensationStepDone(step: SagaStep): void {
    this._currentStep = step;
    this._completedSteps.push(step);
    this._updatedAt = new Date();
  }

  markFailed(errorMessage: string): void {
    this._status = SagaStatus.FAILED;
    this._errorMessage = errorMessage;
    this._updatedAt = new Date();
  }

  // Helpers
  hasReservations(): boolean {
    return this._reservationIds.length > 0;
  }

  hasPayment(): boolean {
    return this._paymentId !== undefined;
  }

  needsInventoryRelease(): boolean {
    return this._completedSteps.includes(SagaStep.RESERVE_INVENTORY);
  }

  needsPaymentRefund(): boolean {
    return this._completedSteps.includes(SagaStep.PROCESS_PAYMENT);
  }

  isCompleted(): boolean {
    return this._status === SagaStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this._status === SagaStatus.FAILED;
  }
}
