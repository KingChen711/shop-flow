import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError } from '@shopflow/shared-utils';
import { GetStockQuery } from '../get-stock.query';
import { Inventory } from '@domain/entities/inventory.entity';
import { IInventoryRepository } from '@domain/repositories/inventory.repository.interface';

@QueryHandler(GetStockQuery)
export class GetStockHandler implements IQueryHandler<GetStockQuery> {
  constructor(
    @Inject('InventoryRepository')
    private readonly inventoryRepository: IInventoryRepository
  ) {}

  async execute(query: GetStockQuery): Promise<Inventory> {
    const { productId } = query;

    const inventory = await this.inventoryRepository.findByProductId(productId);

    if (!inventory) {
      throw new NotFoundError(`Inventory not found for product: ${productId}`);
    }

    return inventory;
  }
}
