import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NotFoundError, ConflictError } from '@shopflow/shared-utils';
import { ReleaseReservationCommand } from '../release-reservation.command';
import { Reservation, ReservationStatus } from '@domain/entities/reservation.entity';
import { IInventoryRepository } from '@domain/repositories/inventory.repository.interface';
import { IReservationRepository } from '@domain/repositories/reservation.repository.interface';
import { StockReleasedEvent } from '@domain/events/inventory.events';
import { DistributedLockService } from '@infrastructure/redis/distributed-lock.service';
import { InventoryEntity } from '@infrastructure/persistence/entities/inventory.entity';
import { ReservationEntity } from '@infrastructure/persistence/entities/reservation.entity';

@CommandHandler(ReleaseReservationCommand)
export class ReleaseReservationHandler implements ICommandHandler<ReleaseReservationCommand> {
  private readonly logger = new Logger(ReleaseReservationHandler.name);

  constructor(
    @Inject('InventoryRepository')
    private readonly inventoryRepository: IInventoryRepository,
    @Inject('ReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    private readonly lockService: DistributedLockService,
    private readonly eventBus: EventBus,
    private readonly dataSource: DataSource
  ) {}

  async execute(command: ReleaseReservationCommand): Promise<Reservation> {
    const { reservationId, reason } = command;

    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      throw new NotFoundError(`Reservation not found: ${reservationId}`);
    }

    if (reservation.status !== ReservationStatus.RESERVED) {
      throw new ConflictError(`Cannot release reservation with status: ${reservation.status}`);
    }

    const lockKey = `inventory:${reservation.productId}`;

    return this.lockService.withLock(lockKey, async () => {
      const inventory = await this.inventoryRepository.findByProductId(reservation.productId);

      if (!inventory) {
        throw new NotFoundError(`Inventory not found for product: ${reservation.productId}`);
      }

      // Release stock in inventory
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

        // Publish event after successful commit
        this.eventBus.publish(
          new StockReleasedEvent(
            reservationId,
            reservation.orderId,
            reservation.productId,
            reservation.quantity,
            reason
          )
        );

        this.logger.log(
          `Reservation released: ${reservationId}, order ${reservation.orderId}, reason: ${reason}`
        );

        return reservation;
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
