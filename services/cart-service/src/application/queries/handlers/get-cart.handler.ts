import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCartQuery } from '../get-cart.query';
import { Cart } from '@domain/entities/cart.entity';
import { ICartRepository } from '@domain/repositories/cart.repository.interface';

@QueryHandler(GetCartQuery)
export class GetCartHandler implements IQueryHandler<GetCartQuery> {
  constructor(
    @Inject('CartRepository')
    private readonly cartRepository: ICartRepository
  ) {}

  async execute(query: GetCartQuery): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(query.userId);

    // Return existing cart or empty cart
    return cart || Cart.create(query.userId);
  }
}
