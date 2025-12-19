import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { IndexProductCommand } from '../index-product.command';
import { SearchProduct } from '@domain/entities/search-product.entity';
import {
  ISearchRepository,
  SEARCH_REPOSITORY,
} from '@domain/repositories/search.repository.interface';

@CommandHandler(IndexProductCommand)
export class IndexProductHandler implements ICommandHandler<IndexProductCommand> {
  private readonly logger = new Logger(IndexProductHandler.name);

  constructor(
    @Inject(SEARCH_REPOSITORY)
    private readonly searchRepository: ISearchRepository
  ) {}

  async execute(command: IndexProductCommand): Promise<void> {
    this.logger.log(`Indexing product: ${command.id}`);

    const product = SearchProduct.create({
      id: command.id,
      name: command.name,
      description: command.description,
      price: command.price,
      categoryId: command.categoryId,
      categoryName: command.categoryName,
      imageUrls: command.imageUrls,
      attributes: command.attributes,
      createdAt: new Date(command.createdAt),
      updatedAt: new Date(command.updatedAt),
    });

    await this.searchRepository.indexProduct(product);

    this.logger.log(`Product indexed successfully: ${command.id}`);
  }
}
