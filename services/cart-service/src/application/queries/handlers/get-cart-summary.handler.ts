import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCartSummaryQuery } from '../get-cart-summary.query';
import { ICartRepository } from '@domain/repositories/cart.repository.interface';

export interface CartSummary {
  userId: string;
  itemCount: number;
  total: number;
}

@QueryHandler(GetCartSummaryQuery)
export class GetCartSummaryHandler implements IQueryHandler<GetCartSummaryQuery> {
  constructor(
    @Inject('CartRepository')
    private readonly cartRepository: ICartRepository
  ) {}

  async execute(query: GetCartSummaryQuery): Promise<CartSummary> {
    const cart = await this.cartRepository.findByUserId(query.userId);

    if (!cart) {
      return {
        userId: query.userId,
        itemCount: 0,
        total: 0,
      };
    }

    return {
      userId: cart.userId,
      itemCount: cart.itemCount,
      total: cart.total,
    };
  }
}
