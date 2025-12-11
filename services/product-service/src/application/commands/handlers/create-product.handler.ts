import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundError } from '@shopflow/shared-utils';
import { CreateProductCommand } from '../create-product.command';
import { Product } from '@domain/entities/product.entity';
import { IProductRepository } from '@domain/repositories/product.repository.interface';
import { ICategoryRepository } from '@domain/repositories/category.repository.interface';
import { ProductCreatedEvent } from '@domain/events/product.events';
import { OutboxService } from '@infrastructure/outbox/outbox.service';
import { ProductEntity } from '@infrastructure/persistence/entities/product.entity';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('CategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    private readonly eventBus: EventBus,
    private readonly outboxService: OutboxService,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    const { name, description, price, categoryId, imageUrls, attributes } = command;

    // Verify category exists
    const categoryExists = await this.categoryRepository.exists(categoryId);
    if (!categoryExists) {
      throw new NotFoundError('Category', categoryId);
    }

    // Create product entity
    const product = Product.create({
      name,
      description,
      price,
      categoryId,
      imageUrls,
      attributes,
    });

    // Use transaction to save product and outbox event atomically
    // This is the Outbox Pattern - ensuring reliable event publishing
    const savedProduct = await this.dataSource.transaction(async (entityManager) => {
      // Save product
      const productEntity = new ProductEntity();
      productEntity.id = product.id;
      productEntity.name = product.name;
      productEntity.description = product.description;
      productEntity.price = product.price;
      productEntity.categoryId = product.categoryId;
      productEntity.imageUrls = product.imageUrls;
      productEntity.attributes = product.attributes;
      productEntity.isActive = product.isActive;

      const saved = await entityManager.save(ProductEntity, productEntity);

      // Create domain event
      const event = new ProductCreatedEvent(product.id, {
        productId: product.id,
        name: product.name,
        price: product.price,
        categoryId: product.categoryId,
      });

      // Add event to outbox (same transaction)
      await this.outboxService.addEvent(event, entityManager);

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

    // Publish domain event internally
    const event = new ProductCreatedEvent(savedProduct.id, {
      productId: savedProduct.id,
      name: savedProduct.name,
      price: savedProduct.price,
      categoryId: savedProduct.categoryId,
    });
    this.eventBus.publish(event);

    return savedProduct;
  }
}
