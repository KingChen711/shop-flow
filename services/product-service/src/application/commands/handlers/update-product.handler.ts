import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundError } from '@shopflow/shared-utils';
import { UpdateProductCommand } from '../update-product.command';
import { Product } from '../../../domain/entities/product.entity';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { ProductUpdatedEvent } from '../../../domain/events/product.events';
import { OutboxService } from '../../../infrastructure/outbox/outbox.service';
import { ProductEntity } from '../../../infrastructure/persistence/entities/product.entity';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: IProductRepository,
    private readonly eventBus: EventBus,
    private readonly outboxService: OutboxService,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async execute(command: UpdateProductCommand): Promise<Product> {
    const { productId, name, description, price, categoryId, imageUrls, attributes } = command;

    // Find product
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product', productId);
    }

    // Track changes for event
    const changes: Record<string, unknown> = {};

    if (name && name !== product.name) {
      changes.name = { from: product.name, to: name };
    }
    if (description !== undefined && description !== product.description) {
      changes.description = { from: product.description, to: description };
    }
    if (price !== undefined && price !== product.price) {
      changes.price = { from: product.price, to: price };
    }
    if (categoryId && categoryId !== product.categoryId) {
      changes.categoryId = { from: product.categoryId, to: categoryId };
    }

    // Update product
    product.updateDetails({ name, description, price, categoryId });

    if (imageUrls) {
      product.setImages(imageUrls);
      changes.imageUrls = imageUrls;
    }

    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        product.setAttribute(key, value);
      });
      changes.attributes = attributes;
    }

    // Use transaction to update product and outbox event atomically
    const updatedProduct = await this.dataSource.transaction(async (entityManager) => {
      const productEntity = new ProductEntity();
      productEntity.id = product.id;
      productEntity.name = product.name;
      productEntity.description = product.description;
      productEntity.price = product.price;
      productEntity.categoryId = product.categoryId;
      productEntity.imageUrls = product.imageUrls;
      productEntity.attributes = product.attributes;
      productEntity.isActive = product.isActive;
      productEntity.createdAt = product.createdAt;
      productEntity.updatedAt = product.updatedAt;

      const saved = await entityManager.save(ProductEntity, productEntity);

      // Only add to outbox if there were changes
      if (Object.keys(changes).length > 0) {
        const event = new ProductUpdatedEvent(productId, { productId, changes });
        await this.outboxService.addEvent(event, entityManager);
      }

      return Product.reconstitute({
        id: saved.id,
        name: saved.name,
        description: saved.description,
        price: Number(saved.price),
        categoryId: saved.categoryId,
        imageUrls: saved.imageUrls,
        attributes: saved.attributes,
        isActive: saved.isActive,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      });
    });

    // Publish event internally if there were changes
    if (Object.keys(changes).length > 0) {
      const event = new ProductUpdatedEvent(productId, { productId, changes });
      this.eventBus.publish(event);
    }

    return updatedProduct;
  }
}
