import { v4 as uuidv4 } from 'uuid';
import { OrderItem, OrderItemProps } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export interface CreateOrderProps {
  userId: string;
  items: OrderItemProps[];
  shippingAddress: string;
  notes?: string;
}

export interface OrderProps {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  notes?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Order {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    private _items: OrderItem[],
    private _totalAmount: number,
    private _status: OrderStatus,
    public readonly shippingAddress: string,
    public readonly notes: string | undefined,
    private _failureReason: string | undefined,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  // Getters
  get items(): OrderItem[] {
    return [...this._items];
  }

  get totalAmount(): number {
    return this._totalAmount;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get failureReason(): string | undefined {
    return this._failureReason;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Factory methods
  static create(props: CreateOrderProps): Order {
    const id = uuidv4();
    const now = new Date();

    const items = props.items.map((itemProps) => OrderItem.create(id, itemProps));
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    return new Order(
      id,
      props.userId,
      items,
      totalAmount,
      OrderStatus.PENDING,
      props.shippingAddress,
      props.notes,
      undefined,
      now,
      now
    );
  }

  static fromPersistence(props: OrderProps): Order {
    return new Order(
      props.id,
      props.userId,
      props.items,
      props.totalAmount,
      props.status,
      props.shippingAddress,
      props.notes,
      props.failureReason,
      props.createdAt,
      props.updatedAt
    );
  }

  // State transitions
  confirm(): void {
    if (this._status !== OrderStatus.PENDING) {
      throw new Error(`Cannot confirm order in status: ${this._status}`);
    }
    this._status = OrderStatus.CONFIRMED;
    this._updatedAt = new Date();
  }

  startProcessing(): void {
    if (this._status !== OrderStatus.CONFIRMED) {
      throw new Error(`Cannot start processing order in status: ${this._status}`);
    }
    this._status = OrderStatus.PROCESSING;
    this._updatedAt = new Date();
  }

  ship(): void {
    if (this._status !== OrderStatus.PROCESSING) {
      throw new Error(`Cannot ship order in status: ${this._status}`);
    }
    this._status = OrderStatus.SHIPPED;
    this._updatedAt = new Date();
  }

  deliver(): void {
    if (this._status !== OrderStatus.SHIPPED) {
      throw new Error(`Cannot deliver order in status: ${this._status}`);
    }
    this._status = OrderStatus.DELIVERED;
    this._updatedAt = new Date();
  }

  cancel(reason: string): void {
    if (this._status === OrderStatus.DELIVERED || this._status === OrderStatus.CANCELLED) {
      throw new Error(`Cannot cancel order in status: ${this._status}`);
    }
    this._status = OrderStatus.CANCELLED;
    this._failureReason = reason;
    this._updatedAt = new Date();
  }

  fail(reason: string): void {
    if (this._status !== OrderStatus.PENDING) {
      throw new Error(`Cannot fail order in status: ${this._status}`);
    }
    this._status = OrderStatus.FAILED;
    this._failureReason = reason;
    this._updatedAt = new Date();
  }

  // Helpers
  canCancel(): boolean {
    return (
      this._status !== OrderStatus.DELIVERED &&
      this._status !== OrderStatus.CANCELLED &&
      this._status !== OrderStatus.FAILED
    );
  }

  isPending(): boolean {
    return this._status === OrderStatus.PENDING;
  }

  isCompleted(): boolean {
    return this._status === OrderStatus.DELIVERED;
  }
}
