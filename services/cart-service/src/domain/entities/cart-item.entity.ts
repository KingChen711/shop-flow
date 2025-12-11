import { generateId } from '@shopflow/shared-utils';

export interface CartItemProps {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export class CartItem {
  private readonly props: CartItemProps;

  constructor(props: CartItemProps) {
    this.props = { ...props };
  }

  // Getters
  get productId(): string {
    return this.props.productId;
  }

  get productName(): string {
    return this.props.productName;
  }

  get price(): number {
    return this.props.price;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get imageUrl(): string {
    return this.props.imageUrl || '';
  }

  get subtotal(): number {
    return this.props.price * this.props.quantity;
  }

  // Business Logic
  updateQuantity(quantity: number): void {
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }
    this.props.quantity = quantity;
  }

  incrementQuantity(amount: number = 1): void {
    this.props.quantity += amount;
  }

  decrementQuantity(amount: number = 1): void {
    const newQuantity = this.props.quantity - amount;
    if (newQuantity < 1) {
      throw new Error('Quantity cannot be less than 1');
    }
    this.props.quantity = newQuantity;
  }

  // Serialization
  toJSON(): Record<string, unknown> {
    return {
      productId: this.props.productId,
      productName: this.props.productName,
      price: this.props.price,
      quantity: this.props.quantity,
      imageUrl: this.props.imageUrl || '',
      subtotal: this.subtotal,
    };
  }

  static fromJSON(data: Record<string, unknown>): CartItem {
    return new CartItem({
      productId: data.productId as string,
      productName: data.productName as string,
      price: data.price as number,
      quantity: data.quantity as number,
      imageUrl: data.imageUrl as string,
    });
  }
}
