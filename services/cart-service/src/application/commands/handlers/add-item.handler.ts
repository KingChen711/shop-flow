import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AddItemCommand } from '../add-item.command';
import { Cart } from '@domain/entities/cart.entity';
import { ICartRepository } from '@domain/repositories/cart.repository.interface';

// Cart expiration time: 7 days
const CART_TTL_SECONDS = 7 * 24 * 60 * 60;

@CommandHandler(AddItemCommand)
export class AddItemHandler implements ICommandHandler<AddItemCommand> {
  private readonly logger = new Logger(AddItemHandler.name);

  constructor(
    @Inject('CartRepository')
    private readonly cartRepository: ICartRepository
  ) {}

  async execute(command: AddItemCommand): Promise<Cart> {
    const { userId, productId, productName, price, quantity, imageUrl } = command;

    this.logger.log(`Adding item ${productId} to cart for user ${userId}`);

    // Get existing cart or create new one
    let cart = await this.cartRepository.findByUserId(userId);

    if (!cart) {
      cart = Cart.create(userId);
    }

    // Add item to cart
    cart.addItem({
      productId,
      productName,
      price,
      quantity,
      imageUrl,
    });

    // Save cart
    await this.cartRepository.save(cart);

    // Set/refresh expiration
    await this.cartRepository.setExpiration(userId, CART_TTL_SECONDS);

    this.logger.log(`Item ${productId} added to cart. Total items: ${cart.itemCount}`);

    return cart;
  }
}
