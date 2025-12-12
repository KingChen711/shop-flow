import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConflictError } from '@shopflow/shared-utils';
import { IInventoryRepository } from '@domain/repositories/inventory.repository.interface';
import { Inventory } from '@domain/entities/inventory.entity';
import { InventoryEntity } from '../entities/inventory.entity';

@Injectable()
export class InventoryRepositoryImpl implements IInventoryRepository {
  private readonly logger = new Logger(InventoryRepositoryImpl.name);

  constructor(
    @InjectRepository(InventoryEntity)
    private readonly repository: Repository<InventoryEntity>
  ) {}

  async findById(id: string): Promise<Inventory | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByProductId(productId: string): Promise<Inventory | null> {
    const entity = await this.repository.findOne({ where: { productId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByProductIds(productIds: string[]): Promise<Inventory[]> {
    const entities = await this.repository.find({
      where: { productId: In(productIds) },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async save(inventory: Inventory): Promise<Inventory> {
    const entity = this.toEntity(inventory);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async saveWithOptimisticLock(inventory: Inventory, expectedVersion: number): Promise<Inventory> {
    const entity = this.toEntity(inventory);

    const result = await this.repository
      .createQueryBuilder()
      .update(InventoryEntity)
      .set({
        totalStock: entity.totalStock,
        reservedStock: entity.reservedStock,
        version: expectedVersion + 1,
      })
      .where('id = :id AND version = :version', {
        id: entity.id,
        version: expectedVersion,
      })
      .execute();

    if (result.affected === 0) {
      throw new ConflictError('Inventory was modified by another transaction. Please retry.');
    }

    return this.findById(inventory.id) as Promise<Inventory>;
  }

  private toDomain(entity: InventoryEntity): Inventory {
    return Inventory.fromPersistence({
      id: entity.id,
      productId: entity.productId,
      totalStock: entity.totalStock,
      reservedStock: entity.reservedStock,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(inventory: Inventory): InventoryEntity {
    const entity = new InventoryEntity();
    entity.id = inventory.id;
    entity.productId = inventory.productId;
    entity.totalStock = inventory.totalStock;
    entity.reservedStock = inventory.reservedStock;
    entity.version = inventory.version;
    entity.createdAt = inventory.createdAt;
    entity.updatedAt = inventory.updatedAt;
    return entity;
  }
}
