export interface StockReservationItem {
  productId: string;
  quantity: number;
}

export class ReserveMultipleStockCommand {
  constructor(
    public readonly orderId: string,
    public readonly items: StockReservationItem[],
    public readonly ttlMinutes: number = 15
  ) {}
}
