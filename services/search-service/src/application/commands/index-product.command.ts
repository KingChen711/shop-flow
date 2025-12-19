export interface ProductAttribute {
  key: string;
  value: string;
}

export class IndexProductCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly categoryId: string,
    public readonly categoryName: string,
    public readonly imageUrls: string[],
    public readonly attributes: ProductAttribute[],
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}
}
