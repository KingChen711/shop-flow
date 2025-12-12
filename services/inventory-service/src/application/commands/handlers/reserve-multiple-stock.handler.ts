import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReserveMultipleStockCommand } from '../reserve-multiple-stock.command';
import { Reservation } from '@domain/entities/reservation.entity';
import { IInventoryRepository } from '@domain/repositories/inventory.repository.interface';
import { StockReservedEvent } from '@domain/events/inventory.events';
import { DistributedLockService } from '@infrastructure/redis/distributed-lock.service';
import { InventoryEntity } from '@infrastructure/persistence/entities/inventory.entity';
import { ReservationEntity } from '@infrastructure/persistence/entities/reservation.entity';

export interface ReserveMultipleResult {
  success: boolean;
  reservations: Reservation[];
  failedProductIds: string[];
  errorMessage?: string;
}

@CommandHandler(ReserveMultipleStockCommand)
export class ReserveMultipleStockHandler implements ICommandHandler<ReserveMultipleStockCommand> {
  private readonly logger = new Logger(ReserveMultipleStockHandler.name);

  constructor(
    @Inject('InventoryRepository')
    private readonly inventoryRepository: IInventoryRepository,
    private readonly lockService: DistributedLockService,
    private readonly eventBus: EventBus,
    private readonly dataSource: DataSource
  ) {}

  async execute(command: ReserveMultipleStockCommand): Promise<ReserveMultipleResult> {
    const { orderId, items, ttlMinutes } = command;

    // Get all product IDs and sort them to prevent deadlocks
    const productIds = items.map((item) => item.productId).sort();
    const lockKeys = productIds.map((id) => `inventory:${id}`);

    return this.lockService.withMultipleLocks(lockKeys, async () => {
      const failedProductIds: string[] = [];
      const inventoriesToSave: { inventory: any; reservation: Reservation }[] = [];

      // First pass: validate all items can be reserved
      for (const item of items) {
        const inventory = await this.inventoryRepository.findByProductId(item.productId);

        if (!inventory) {
          failedProductIds.push(item.productId);
          continue;
        }

        if (!inventory.canReserve(item.quantity)) {
          failedProductIds.push(item.productId);
          continue;
        }

        // Reserve in memory
        inventory.reserve(item.quantity);
        const reservation = Reservation.create(orderId, item.productId, item.quantity, ttlMinutes);

        inventoriesToSave.push({ inventory, reservation });
      }

      // If any failed, rollback all in-memory changes and return failure
      if (failedProductIds.length > 0) {
        return {
          success: false,
          reservations: [],
          failedProductIds,
          errorMessage: `Insufficient stock for products: ${failedProductIds.join(', ')}`,
        };
      }

      // Use transaction to persist all changes atomically
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const reservations: Reservation[] = [];

        for (const { inventory, reservation } of inventoriesToSave) {
          // Save inventory
          const inventoryEntity = this.toInventoryEntity(inventory);
          await queryRunner.manager.save(InventoryEntity, inventoryEntity);

          // Save reservation
          const reservationEntity = this.toReservationEntity(reservation);
          await queryRunner.manager.save(ReservationEntity, reservationEntity);

          reservations.push(reservation);
        }

        await queryRunner.commitTransaction();

        // Publish events after successful commit
        for (const reservation of reservations) {
          this.eventBus.publish(
            new StockReservedEvent(
              reservation.id,
              orderId,
              reservation.productId,
              reservation.quantity,
              reservation.expiresAt
            )
          );
        }

        this.logger.log(
          `Multiple stock reserved for order ${orderId}: ${reservations.length} items`
        );

        return {
          success: true,
          reservations,
          failedProductIds: [],
        };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    });
  }

  private toInventoryEntity(inventory: any): InventoryEntity {
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

  private toReservationEntity(reservation: Reservation): ReservationEntity {
    const entity = new ReservationEntity();
    entity.id = reservation.id;
    entity.orderId = reservation.orderId;
    entity.productId = reservation.productId;
    entity.quantity = reservation.quantity;
    entity.status = reservation.status;
    entity.expiresAt = reservation.expiresAt;
    entity.createdAt = reservation.createdAt;
    entity.updatedAt = reservation.updatedAt;
    return entity;
  }
}
