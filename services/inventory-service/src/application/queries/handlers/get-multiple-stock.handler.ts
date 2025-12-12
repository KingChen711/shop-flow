import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetMultipleStockQuery } from '../get-multiple-stock.query';
import { Inventory } from '@domain/entities/inventory.entity';
import { IInventoryRepository } from '@domain/repositories/inventory.repository.interface';

@QueryHandler(GetMultipleStockQuery)
export class GetMultipleStockHandler implements IQueryHandler<GetMultipleStockQuery> {
  constructor(
    @Inject('InventoryRepository')
    private readonly inventoryRepository: IInventoryRepository
  ) {}

  async execute(query: GetMultipleStockQuery): Promise<Inventory[]> {
    const { productIds } = query;

    if (productIds.length === 0) {
      return [];
    }

    return this.inventoryRepository.findByProductIds(productIds);
  }
}
