export class ListProductsQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly categoryId?: string,
    public readonly search?: string,
    public readonly minPrice?: number,
    public readonly maxPrice?: number,
    public readonly sortBy?: string,
    public readonly sortOrder?: 'ASC' | 'DESC'
  ) {}
}
