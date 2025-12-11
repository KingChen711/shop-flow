export class AddItemCommand {
  constructor(
    public readonly userId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly price: number,
    public readonly quantity: number,
    public readonly imageUrl?: string
  ) {}
}
