import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { IReservationRepository } from '@domain/repositories/reservation.repository.interface';
import { IInventoryRepository } from '@domain/repositories/inventory.repository.interface';
import { Reservation } from '@domain/entities/reservation.entity';
import { ReservationExpiredEvent } from '@domain/events/inventory.events';
import { DistributedLockService } from '@infrastructure/redis/distributed-lock.service';
import { InventoryEntity } from '@infrastructure/persistence/entities/inventory.entity';
import { ReservationEntity } from '@infrastructure/persistence/entities/reservation.entity';

@Injectable()
export class ReservationExpiryScheduler {
  private readonly logger = new Logger(ReservationExpiryScheduler.name);

  constructor(
    @Inject('ReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    @Inject('InventoryRepository')
    private readonly inventoryRepository: IInventoryRepository,
    private readonly lockService: DistributedLockService,
    private readonly eventBus: EventBus,
    private readonly dataSource: DataSource
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations() {
    this.logger.debug('Checking for expired reservations...');

    try {
      const expiredReservations = await this.reservationRepository.findExpiredReservations();

      if (expiredReservations.length === 0) {
        return;
      }

      this.logger.log(`Found ${expiredReservations.length} expired reservations`);

      for (const reservation of expiredReservations) {
        try {
          const lockKey = `inventory:${reservation.productId}`;

          await this.lockService.withLock(lockKey, async () => {
            const inventory = await this.inventoryRepository.findByProductId(reservation.productId);

            if (!inventory) {
              this.logger.warn(`Inventory not found for product: ${reservation.productId}`);
              return;
            }

            // Release the reserved stock
            inventory.release(reservation.quantity);
            reservation.expire();

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

              // Publish event after successful commit
              this.eventBus.publish(
                new ReservationExpiredEvent(
                  reservation.id,
                  reservation.orderId,
                  reservation.productId,
                  reservation.quantity
                )
              );

              this.logger.log(
                `Expired reservation released: ${reservation.id}, order ${reservation.orderId}`
              );
            } catch (error) {
              await queryRunner.rollbackTransaction();
              throw error;
            } finally {
              await queryRunner.release();
            }
          });
        } catch (error) {
          this.logger.error(`Failed to process expired reservation ${reservation.id}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to process expired reservations:', error);
    }
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
