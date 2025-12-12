export class UpdateStockCommand {
  constructor(
    public readonly productId: string,
    public readonly quantity: number,
    public readonly reason: string
  ) {}
}
