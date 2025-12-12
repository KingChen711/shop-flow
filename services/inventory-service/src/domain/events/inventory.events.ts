export class StockReservedEvent {
  constructor(
    public readonly reservationId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly expiresAt: Date
  ) {}
}

export class StockReleasedEvent {
  constructor(
    public readonly reservationId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly reason: string
  ) {}
}

export class StockConfirmedEvent {
  constructor(
    public readonly reservationId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number
  ) {}
}

export class StockUpdatedEvent {
  constructor(
    public readonly productId: string,
    public readonly previousStock: number,
    public readonly newStock: number,
    public readonly reason: string
  ) {}
}

export class LowStockAlertEvent {
  constructor(
    public readonly productId: string,
    public readonly currentStock: number,
    public readonly threshold: number
  ) {}
}

export class ReservationExpiredEvent {
  constructor(
    public readonly reservationId: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number
  ) {}
}
