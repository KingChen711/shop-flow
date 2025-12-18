import { OrderStatus } from '../entities/order.entity';

// Base event interface
interface OrderEvent {
  eventType: string;
  orderId: string;
  timestamp: Date;
}

// Order Created Event
export class OrderCreatedEvent implements OrderEvent {
  readonly eventType = 'order.created';
  readonly timestamp = new Date();

  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly totalAmount: number,
    public readonly items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>
  ) {}
}

// Order Confirmed Event
export class OrderConfirmedEvent implements OrderEvent {
  readonly eventType = 'order.confirmed';
  readonly timestamp = new Date();

  constructor(
    public readonly orderId: string,
    public readonly userId: string
  ) {}
}

// Order Cancelled Event
export class OrderCancelledEvent implements OrderEvent {
  readonly eventType = 'order.cancelled';
  readonly timestamp = new Date();

  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly reason: string
  ) {}
}

// Order Failed Event
export class OrderFailedEvent implements OrderEvent {
  readonly eventType = 'order.failed';
  readonly timestamp = new Date();

  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly reason: string
  ) {}
}

// Order Status Changed Event
export class OrderStatusChangedEvent implements OrderEvent {
  readonly eventType = 'order.status_changed';
  readonly timestamp = new Date();

  constructor(
    public readonly orderId: string,
    public readonly previousStatus: OrderStatus,
    public readonly newStatus: OrderStatus
  ) {}
}

// Saga Events
export class SagaStartedEvent {
  readonly eventType = 'saga.started';
  readonly timestamp = new Date();

  constructor(
    public readonly sagaId: string,
    public readonly orderId: string
  ) {}
}

export class SagaCompletedEvent {
  readonly eventType = 'saga.completed';
  readonly timestamp = new Date();

  constructor(
    public readonly sagaId: string,
    public readonly orderId: string
  ) {}
}

export class SagaFailedEvent {
  readonly eventType = 'saga.failed';
  readonly timestamp = new Date();

  constructor(
    public readonly sagaId: string,
    public readonly orderId: string,
    public readonly reason: string
  ) {}
}
