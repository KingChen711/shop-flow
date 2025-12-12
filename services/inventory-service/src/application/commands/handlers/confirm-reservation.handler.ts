import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NotFoundError, ConflictError } from '@shopflow/shared-utils';
import { ConfirmReservationCommand } from '../confirm-reservation.command';
import { Reservation } from '@domain/entities/reservation.entity';
import { IInventoryRepository } from '@domain/repositories/inventory.repository.interface';
import { IReservationRepository } from '@domain/repositories/reservation.repository.interface';
import { StockConfirmedEvent } from '@domain/events/inventory.events';
import { DistributedLockService } from '@infrastructure/redis/distributed-lock.service';
import { InventoryEntity } from '@infrastructure/persistence/entities/inventory.entity';
import { ReservationEntity } from '@infrastructure/persistence/entities/reservation.entity';

@CommandHandler(ConfirmReservationCommand)
export class ConfirmReservationHandler implements ICommandHandler<ConfirmReservationCommand> {
  private readonly logger = new Logger(ConfirmReservationHandler.name);

  constructor(
    @Inject('InventoryRepository')
    private readonly inventoryRepository: IInventoryRepository,
    @Inject('ReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    private readonly lockService: DistributedLockService,
    private readonly eventBus: EventBus,
    private readonly dataSource: DataSource
  ) {}

  async execute(command: ConfirmReservationCommand): Promise<Reservation> {
    const { reservationId } = command;

    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      throw new NotFoundError(`Reservation not found: ${reservationId}`);
    }

    if (reservation.isExpired) {
      throw new ConflictError(`Reservation has expired: ${reservationId}`);
    }

    const lockKey = `inventory:${reservation.productId}`;

    return this.lockService.withLock(lockKey, async () => {
      const inventory = await this.inventoryRepository.findByProductId(reservation.productId);

      if (!inventory) {
        throw new NotFoundError(`Inventory not found for product: ${reservation.productId}`);
      }

      // Confirm the reservation (reduces both reserved and total stock)
      inventory.confirm(reservation.quantity);
      reservation.confirm();

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
          new StockConfirmedEvent(
            reservationId,
            reservation.orderId,
            reservation.productId,
            reservation.quantity
          )
        );

        this.logger.log(
          `Reservation confirmed: ${reservationId}, order ${reservation.orderId}, product ${reservation.productId}`
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
