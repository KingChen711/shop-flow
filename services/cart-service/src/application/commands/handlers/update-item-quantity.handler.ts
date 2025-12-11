import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { NotFoundError } from '@shopflow/shared-utils';
import { UpdateItemQuantityCommand } from '../update-item-quantity.command';
import { Cart } from '@domain/entities/cart.entity';
import { ICartRepository } from '@domain/repositories/cart.repository.interface';

@CommandHandler(UpdateItemQuantityCommand)
export class UpdateItemQuantityHandler implements ICommandHandler<UpdateItemQuantityCommand> {
  private readonly logger = new Logger(UpdateItemQuantityHandler.name);

  constructor(
    @Inject('CartRepository')
    private readonly cartRepository: ICartRepository
  ) {}

  async execute(command: UpdateItemQuantityCommand): Promise<Cart> {
    const { userId, productId, quantity } = command;

    this.logger.log(`Updating item ${productId} quantity to ${quantity} for user ${userId}`);

    // Get existing cart
    const cart = await this.cartRepository.findByUserId(userId);

    if (!cart) {
      throw new NotFoundError('Cart', userId);
    }

    if (!cart.hasItem(productId)) {
      throw new NotFoundError('Cart Item', productId);
    }

    // Update quantity (will remove if quantity <= 0)
    cart.updateItemQuantity(productId, quantity);

    // Save cart
    await this.cartRepository.save(cart);

    this.logger.log(`Item ${productId} quantity updated. Total items: ${cart.itemCount}`);

    return cart;
  }
}
