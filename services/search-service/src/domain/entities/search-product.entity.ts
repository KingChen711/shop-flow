export interface ProductAttribute {
  key: string;
  value: string;
}

export interface SearchProductProps {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName: string;
  imageUrls: string[];
  attributes: ProductAttribute[];
  createdAt: Date;
  updatedAt: Date;
}

export class SearchProduct {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly categoryId: string,
    public readonly categoryName: string,
    public readonly imageUrls: string[],
    public readonly attributes: ProductAttribute[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(props: SearchProductProps): SearchProduct {
    return new SearchProduct(
      props.id,
      props.name,
      props.description,
      props.price,
      props.categoryId,
      props.categoryName,
      props.imageUrls,
      props.attributes,
      props.createdAt,
      props.updatedAt
    );
  }

  static fromElasticsearch(source: Record<string, unknown>, id: string): SearchProduct {
    return new SearchProduct(
      id,
      source.name as string,
      source.description as string,
      source.price as number,
      source.category_id as string,
      source.category_name as string,
      (source.image_urls as string[]) || [],
      (source.attributes as ProductAttribute[]) || [],
      new Date(source.created_at as string),
      new Date(source.updated_at as string)
    );
  }

  toElasticsearchDocument(): Record<string, unknown> {
    return {
      name: this.name,
      description: this.description,
      price: this.price,
      category_id: this.categoryId,
      category_name: this.categoryName,
      image_urls: this.imageUrls,
      attributes: this.attributes,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      // For autocomplete/suggestions
      name_suggest: {
        input: this.name.split(' ').filter((w) => w.length > 2),
        weight: 10,
      },
    };
  }
}
