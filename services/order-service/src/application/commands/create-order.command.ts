export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export class CreateOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly items: OrderItemInput[],
    public readonly shippingAddress: string,
    public readonly notes?: string
  ) {}
}
