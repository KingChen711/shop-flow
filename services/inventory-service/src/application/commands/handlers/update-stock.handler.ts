import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { NotFoundError } from '@shopflow/shared-utils';
import { UpdateStockCommand } from '../update-stock.command';
import { Inventory } from '@domain/entities/inventory.entity';
import { IInventoryRepository } from '@domain/repositories/inventory.repository.interface';
import { StockUpdatedEvent, LowStockAlertEvent } from '@domain/events/inventory.events';
import { DistributedLockService } from '@infrastructure/redis/distributed-lock.service';

const LOW_STOCK_THRESHOLD = 10;

@CommandHandler(UpdateStockCommand)
export class UpdateStockHandler implements ICommandHandler<UpdateStockCommand> {
  private readonly logger = new Logger(UpdateStockHandler.name);

  constructor(
    @Inject('InventoryRepository')
    private readonly inventoryRepository: IInventoryRepository,
    private readonly lockService: DistributedLockService,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: UpdateStockCommand): Promise<Inventory> {
    const { productId, quantity, reason } = command;
    const lockKey = `inventory:${productId}`;

    return this.lockService.withLock(lockKey, async () => {
      // Simulate processing time to observe distributed lock behavior (development/testing)
      if (process.env.NODE_ENV === 'development') {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2000ms delay
      }

      let inventory = await this.inventoryRepository.findByProductId(productId);

      if (!inventory) {
        // Create new inventory record if it doesn't exist
        inventory = Inventory.create(productId, Math.max(0, quantity));
      } else {
        const previousStock = inventory.totalStock;

        if (quantity >= 0) {
          // Setting absolute value
          inventory.setStock(quantity);
        } else {
          // Reducing stock
          inventory.updateStock(quantity);
        }

        // Publish stock updated event
        this.eventBus.publish(
          new StockUpdatedEvent(productId, previousStock, inventory.totalStock, reason)
        );
      }

      const savedInventory = await this.inventoryRepository.save(inventory);

      // Check for low stock alert
      if (savedInventory.availableStock <= LOW_STOCK_THRESHOLD) {
        this.logger.warn(
          `Low stock alert for product ${productId}: ${savedInventory.availableStock}`
        );
        this.eventBus.publish(
          new LowStockAlertEvent(productId, savedInventory.availableStock, LOW_STOCK_THRESHOLD)
        );
      }

      this.logger.log(`Stock updated for product ${productId}: ${savedInventory.totalStock}`);
      return savedInventory;
    });
  }
}
