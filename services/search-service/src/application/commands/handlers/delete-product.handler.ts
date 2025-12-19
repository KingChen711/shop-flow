import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { DeleteProductCommand } from '../delete-product.command';
import {
  ISearchRepository,
  SEARCH_REPOSITORY,
} from '@domain/repositories/search.repository.interface';

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand> {
  private readonly logger = new Logger(DeleteProductHandler.name);

  constructor(
    @Inject(SEARCH_REPOSITORY)
    private readonly searchRepository: ISearchRepository
  ) {}

  async execute(command: DeleteProductCommand): Promise<void> {
    this.logger.log(`Deleting product from index: ${command.productId}`);

    await this.searchRepository.deleteProduct(command.productId);

    this.logger.log(`Product deleted from index: ${command.productId}`);
  }
}
