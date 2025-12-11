import { now } from '@shopflow/shared-utils';
import { CartItem, CartItemProps } from './cart-item.entity';

export interface CartProps {
  userId: string;
  items: CartItem[];
  updatedAt?: Date;
}

export class Cart {
  private readonly props: {
    userId: string;
    items: Map<string, CartItem>;
    updatedAt: Date;
  };

  private constructor(props: CartProps) {
    this.props = {
      userId: props.userId,
      items: new Map(props.items.map((item) => [item.productId, item])),
      updatedAt: props.updatedAt || now(),
    };
  }

  // Factory methods
  static create(userId: string): Cart {
    return new Cart({ userId, items: [] });
  }

  static reconstitute(props: CartProps): Cart {
    return new Cart(props);
  }

  // Getters
  get userId(): string {
    return this.props.userId;
  }

  get items(): CartItem[] {
    return Array.from(this.props.items.values());
  }

  get itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isEmpty(): boolean {
    return this.props.items.size === 0;
  }

  // Business Logic
  addItem(itemProps: CartItemProps): void {
    const existingItem = this.props.items.get(itemProps.productId);

    if (existingItem) {
      // Update existing item quantity
      existingItem.incrementQuantity(itemProps.quantity);
    } else {
      // Add new item
      const newItem = new CartItem(itemProps);
      this.props.items.set(itemProps.productId, newItem);
    }

    this.props.updatedAt = now();
  }

  updateItemQuantity(productId: string, quantity: number): void {
    const item = this.props.items.get(productId);
    if (!item) {
      throw new Error(`Item with product ID ${productId} not found in cart`);
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      this.props.items.delete(productId);
    } else {
      item.updateQuantity(quantity);
    }

    this.props.updatedAt = now();
  }

  removeItem(productId: string): void {
    const deleted = this.props.items.delete(productId);
    if (!deleted) {
      throw new Error(`Item with product ID ${productId} not found in cart`);
    }
    this.props.updatedAt = now();
  }

  clear(): void {
    this.props.items.clear();
    this.props.updatedAt = now();
  }

  getItem(productId: string): CartItem | undefined {
    return this.props.items.get(productId);
  }

  hasItem(productId: string): boolean {
    return this.props.items.has(productId);
  }

  // Serialization
  toJSON(): Record<string, unknown> {
    return {
      userId: this.props.userId,
      items: this.items.map((item) => item.toJSON()),
      total: this.total,
      itemCount: this.itemCount,
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }

  static fromJSON(data: Record<string, unknown>): Cart {
    const items = (data.items as Record<string, unknown>[]).map((itemData) =>
      CartItem.fromJSON(itemData)
    );

    return Cart.reconstitute({
      userId: data.userId as string,
      items,
      updatedAt: new Date(data.updatedAt as string),
    });
  }
}
