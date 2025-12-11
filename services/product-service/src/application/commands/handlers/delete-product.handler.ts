import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundError } from '@shopflow/shared-utils';
import { DeleteProductCommand } from '../delete-product.command';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { ProductDeletedEvent } from '../../../domain/events/product.events';
import { OutboxService } from '../../../infrastructure/outbox/outbox.service';
import { ProductEntity } from '../../../infrastructure/persistence/entities/product.entity';

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand> {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: IProductRepository,
    private readonly eventBus: EventBus,
    private readonly outboxService: OutboxService,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async execute(command: DeleteProductCommand): Promise<boolean> {
    const { productId } = command;

    // Find product
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product', productId);
    }

    // Use transaction to delete product and add outbox event atomically
    const deleted = await this.dataSource.transaction(async (entityManager) => {
      // Delete product
      const result = await entityManager.delete(ProductEntity, productId);

      if ((result.affected ?? 0) > 0) {
        // Add event to outbox
        const event = new ProductDeletedEvent(productId, {
          productId,
          name: product.name,
        });
        await this.outboxService.addEvent(event, entityManager);
      }

      return (result.affected ?? 0) > 0;
    });

    if (deleted) {
      // Publish domain event internally
      const event = new ProductDeletedEvent(productId, {
        productId,
        name: product.name,
      });
      this.eventBus.publish(event);
    }

    return deleted;
  }
}
