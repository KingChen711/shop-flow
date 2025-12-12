import { Inventory } from '../entities/inventory.entity';

export interface IInventoryRepository {
  findById(id: string): Promise<Inventory | null>;
  findByProductId(productId: string): Promise<Inventory | null>;
  findByProductIds(productIds: string[]): Promise<Inventory[]>;
  save(inventory: Inventory): Promise<Inventory>;
  saveWithOptimisticLock(inventory: Inventory, expectedVersion: number): Promise<Inventory>;
}
