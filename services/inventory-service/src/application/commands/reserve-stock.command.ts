export class ReserveStockCommand {
  constructor(
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly ttlMinutes: number = 15
  ) {}
}
