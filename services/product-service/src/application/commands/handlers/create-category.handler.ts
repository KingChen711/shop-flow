import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError } from '@shopflow/shared-utils';
import { CreateCategoryCommand } from '../create-category.command';
import { Category } from '../../../domain/entities/category.entity';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { CategoryCreatedEvent } from '../../../domain/events/category.events';

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand> {
  constructor(
    @Inject('CategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateCategoryCommand): Promise<Category> {
    const { name, description, parentId } = command;

    // If parentId provided, verify parent exists
    if (parentId) {
      const parentExists = await this.categoryRepository.exists(parentId);
      if (!parentExists) {
        throw new NotFoundError('Parent Category', parentId);
      }
    }

    // Create category entity
    const category = Category.create({
      name,
      description,
      parentId: parentId || null,
    });

    // Save to database
    const savedCategory = await this.categoryRepository.save(category);

    // Publish domain event
    const event = new CategoryCreatedEvent(savedCategory.id, {
      categoryId: savedCategory.id,
      name: savedCategory.name,
      parentId: savedCategory.parentId,
    });
    this.eventBus.publish(event);

    return savedCategory;
  }
}
