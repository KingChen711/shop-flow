import { v4 as uuidv4 } from 'uuid';

export interface OrderItemProps {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface OrderItemPersistence {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export class OrderItem {
  private constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly quantity: number,
    public readonly price: number,
    public readonly subtotal: number
  ) {}

  static create(orderId: string, props: OrderItemProps): OrderItem {
    return new OrderItem(
      uuidv4(),
      orderId,
      props.productId,
      props.productName,
      props.quantity,
      props.price,
      props.quantity * props.price
    );
  }

  static fromPersistence(props: OrderItemPersistence): OrderItem {
    return new OrderItem(
      props.id,
      props.orderId,
      props.productId,
      props.productName,
      props.quantity,
      props.price,
      props.subtotal
    );
  }
}
