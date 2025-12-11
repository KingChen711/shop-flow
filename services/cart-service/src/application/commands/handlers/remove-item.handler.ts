import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { NotFoundError } from '@shopflow/shared-utils';
import { RemoveItemCommand } from '../remove-item.command';
import { Cart } from '@domain/entities/cart.entity';
import { ICartRepository } from '@domain/repositories/cart.repository.interface';

@CommandHandler(RemoveItemCommand)
export class RemoveItemHandler implements ICommandHandler<RemoveItemCommand> {
  private readonly logger = new Logger(RemoveItemHandler.name);

  constructor(
    @Inject('CartRepository')
    private readonly cartRepository: ICartRepository
  ) {}

  async execute(command: RemoveItemCommand): Promise<Cart> {
    const { userId, productId } = command;

    this.logger.log(`Removing item ${productId} from cart for user ${userId}`);

    // Get existing cart
    const cart = await this.cartRepository.findByUserId(userId);

    if (!cart) {
      throw new NotFoundError('Cart', userId);
    }

    // Remove item
    cart.removeItem(productId);

    // Save cart
    await this.cartRepository.save(cart);

    this.logger.log(`Item ${productId} removed. Total items: ${cart.itemCount}`);

    return cart;
  }
}
