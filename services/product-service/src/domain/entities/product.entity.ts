import { generateId, now } from '@shopflow/shared-utils';

export interface ProductProps {
  id?: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrls?: string[];
  attributes?: Record<string, string>;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product {
  private readonly props: Required<Omit<ProductProps, 'attributes'>> & {
    attributes: Record<string, string>;
  };

  private constructor(props: ProductProps) {
    this.props = {
      id: props.id || generateId(),
      name: props.name,
      description: props.description,
      price: props.price,
      categoryId: props.categoryId,
      imageUrls: props.imageUrls || [],
      attributes: props.attributes || {},
      isActive: props.isActive ?? true,
      createdAt: props.createdAt || now(),
      updatedAt: props.updatedAt || now(),
    };
  }

  // Factory method for creating new products
  static create(props: Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt'>): Product {
    if (props.price < 0) {
      throw new Error('Price cannot be negative');
    }
    return new Product(props);
  }

  // Factory method for reconstituting from persistence
  static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get price(): number {
    return this.props.price;
  }

  get categoryId(): string {
    return this.props.categoryId;
  }

  get imageUrls(): string[] {
    return [...this.props.imageUrls];
  }

  get attributes(): Record<string, string> {
    return { ...this.props.attributes };
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic Methods
  updateDetails(data: {
    name?: string;
    description?: string;
    price?: number;
    categoryId?: string;
  }): void {
    if (data.name) {
      this.props.name = data.name;
    }
    if (data.description !== undefined) {
      this.props.description = data.description;
    }
    if (data.price !== undefined) {
      if (data.price < 0) {
        throw new Error('Price cannot be negative');
      }
      this.props.price = data.price;
    }
    if (data.categoryId) {
      this.props.categoryId = data.categoryId;
    }
    this.props.updatedAt = now();
  }

  addImage(imageUrl: string): void {
    if (!this.props.imageUrls.includes(imageUrl)) {
      this.props.imageUrls.push(imageUrl);
      this.props.updatedAt = now();
    }
  }

  removeImage(imageUrl: string): void {
    const index = this.props.imageUrls.indexOf(imageUrl);
    if (index > -1) {
      this.props.imageUrls.splice(index, 1);
      this.props.updatedAt = now();
    }
  }

  setImages(imageUrls: string[]): void {
    this.props.imageUrls = [...imageUrls];
    this.props.updatedAt = now();
  }

  setAttribute(key: string, value: string): void {
    this.props.attributes[key] = value;
    this.props.updatedAt = now();
  }

  removeAttribute(key: string): void {
    delete this.props.attributes[key];
    this.props.updatedAt = now();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = now();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = now();
  }

  // Serialization
  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      name: this.props.name,
      description: this.props.description,
      price: this.props.price,
      categoryId: this.props.categoryId,
      imageUrls: this.props.imageUrls,
      attributes: this.props.attributes,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
