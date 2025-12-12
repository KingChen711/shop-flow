import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReleaseMultipleStockCommand } from '../release-multiple-stock.command';
import { Reservation, ReservationStatus } from '@domain/entities/reservation.entity';
import { IInventoryRepository } from '@domain/repositories/inventory.repository.interface';
import { IReservationRepository } from '@domain/repositories/reservation.repository.interface';
import { StockReleasedEvent } from '@domain/events/inventory.events';
import { DistributedLockService } from '@infrastructure/redis/distributed-lock.service';
import { InventoryEntity } from '@infrastructure/persistence/entities/inventory.entity';
import { ReservationEntity } from '@infrastructure/persistence/entities/reservation.entity';

export interface ReleaseMultipleResult {
  success: boolean;
  releasedReservationIds: string[];
}

@CommandHandler(ReleaseMultipleStockCommand)
export class ReleaseMultipleStockHandler implements ICommandHandler<ReleaseMultipleStockCommand> {
  private readonly logger = new Logger(ReleaseMultipleStockHandler.name);

  constructor(
    @Inject('InventoryRepository')
    private readonly inventoryRepository: IInventoryRepository,
    @Inject('ReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    private readonly lockService: DistributedLockService,
    private readonly eventBus: EventBus,
    private readonly dataSource: DataSource
  ) {}

  async execute(command: ReleaseMultipleStockCommand): Promise<ReleaseMultipleResult> {
    const { orderId, reservationIds, reason } = command;
    const releasedReservationIds: string[] = [];
    const eventsToPublish: StockReleasedEvent[] = [];

    // Process each reservation
    for (const reservationId of reservationIds) {
      try {
        const reservation = await this.reservationRepository.findById(reservationId);

        if (!reservation) {
          this.logger.warn(`Reservation not found: ${reservationId}`);
          continue;
        }

        if (reservation.status !== ReservationStatus.RESERVED) {
          this.logger.warn(
            `Reservation ${reservationId} cannot be released, status: ${reservation.status}`
          );
          continue;
        }

        const lockKey = `inventory:${reservation.productId}`;

        await this.lockService.withLock(lockKey, async () => {
          const inventory = await this.inventoryRepository.findByProductId(reservation.productId);

          if (!inventory) {
            this.logger.warn(`Inventory not found for product: ${reservation.productId}`);
            return;
          }

          // Release stock
          inventory.release(reservation.quantity);
          reservation.release(reason);

          // Use transaction to ensure atomicity
          const queryRunner = this.dataSource.createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();

          try {
            // Save inventory
            const inventoryEntity = this.toInventoryEntity(inventory);
            await queryRunner.manager.save(InventoryEntity, inventoryEntity);

            // Save reservation
            const reservationEntity = this.toReservationEntity(reservation);
            await queryRunner.manager.save(ReservationEntity, reservationEntity);

            await queryRunner.commitTransaction();

            releasedReservationIds.push(reservationId);

            // Queue event for publishing after transaction
            eventsToPublish.push(
              new StockReleasedEvent(
                reservationId,
                reservation.orderId,
                reservation.productId,
                reservation.quantity,
                reason
              )
            );
          } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
          } finally {
            await queryRunner.release();
          }
        });
      } catch (error) {
        this.logger.error(`Failed to release reservation ${reservationId}:`, error);
      }
    }

    // Publish all events after successful transactions
    for (const event of eventsToPublish) {
      this.eventBus.publish(event);
    }

    this.logger.log(
      `Multiple stock released for order ${orderId}: ${releasedReservationIds.length} reservations`
    );

    return {
      success: releasedReservationIds.length > 0,
      releasedReservationIds,
    };
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
