import { v4 as uuidv4 } from 'uuid';

export enum ReservationStatus {
  RESERVED = 'RESERVED',
  CONFIRMED = 'CONFIRMED',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED',
}

export interface ReservationProps {
  id?: string;
  orderId: string;
  productId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Reservation {
  private readonly _id: string;
  private readonly _orderId: string;
  private readonly _productId: string;
  private readonly _quantity: number;
  private _status: ReservationStatus;
  private readonly _expiresAt: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: ReservationProps) {
    this._id = props.id || uuidv4();
    this._orderId = props.orderId;
    this._productId = props.productId;
    this._quantity = props.quantity;
    this._status = props.status;
    this._expiresAt = props.expiresAt;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Static factory methods
  static create(
    orderId: string,
    productId: string,
    quantity: number,
    ttlMinutes: number = 15
  ): Reservation {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    return new Reservation({
      orderId,
      productId,
      quantity,
      status: ReservationStatus.RESERVED,
      expiresAt,
    });
  }

  static fromPersistence(props: ReservationProps): Reservation {
    return new Reservation(props);
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get orderId(): string {
    return this._orderId;
  }

  get productId(): string {
    return this._productId;
  }

  get quantity(): number {
    return this._quantity;
  }

  get status(): ReservationStatus {
    return this._status;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isExpired(): boolean {
    return new Date() > this._expiresAt && this._status === ReservationStatus.RESERVED;
  }

  get isActive(): boolean {
    return this._status === ReservationStatus.RESERVED && !this.isExpired;
  }

  // Business methods
  confirm(): void {
    if (this._status !== ReservationStatus.RESERVED) {
      throw new Error(`Cannot confirm reservation with status: ${this._status}`);
    }
    if (this.isExpired) {
      throw new Error('Cannot confirm expired reservation');
    }
    this._status = ReservationStatus.CONFIRMED;
    this._updatedAt = new Date();
  }

  release(reason?: string): void {
    if (this._status !== ReservationStatus.RESERVED) {
      throw new Error(`Cannot release reservation with status: ${this._status}`);
    }
    this._status = ReservationStatus.RELEASED;
    this._updatedAt = new Date();
  }

  expire(): void {
    if (this._status !== ReservationStatus.RESERVED) {
      throw new Error(`Cannot expire reservation with status: ${this._status}`);
    }
    this._status = ReservationStatus.EXPIRED;
    this._updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this._id,
      orderId: this._orderId,
      productId: this._productId,
      quantity: this._quantity,
      status: this._status,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
