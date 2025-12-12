export class ReleaseMultipleStockCommand {
  constructor(
    public readonly orderId: string,
    public readonly reservationIds: string[],
    public readonly reason: string = 'Released by request'
  ) {}
}
