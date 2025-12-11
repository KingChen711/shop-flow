export class UpdateProductCommand {
  constructor(
    public readonly productId: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly price?: number,
    public readonly categoryId?: string,
    public readonly imageUrls?: string[],
    public readonly attributes?: Record<string, string>
  ) {}
}
