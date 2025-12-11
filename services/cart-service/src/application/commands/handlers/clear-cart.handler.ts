import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ClearCartCommand } from '../clear-cart.command';
import { ICartRepository } from '@domain/repositories/cart.repository.interface';

@CommandHandler(ClearCartCommand)
export class ClearCartHandler implements ICommandHandler<ClearCartCommand> {
  private readonly logger = new Logger(ClearCartHandler.name);

  constructor(
    @Inject('CartRepository')
    private readonly cartRepository: ICartRepository
  ) {}

  async execute(command: ClearCartCommand): Promise<boolean> {
    const { userId } = command;

    this.logger.log(`Clearing cart for user ${userId}`);

    const deleted = await this.cartRepository.delete(userId);

    if (deleted) {
      this.logger.log(`Cart cleared for user ${userId}`);
    } else {
      this.logger.log(`No cart found for user ${userId}`);
    }

    return deleted;
  }
}
