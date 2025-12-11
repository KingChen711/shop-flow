import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from '../../../domain/entities/category.entity';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { CategoryEntity } from '../entities/category.entity';

@Injectable()
export class CategoryRepositoryImpl implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>
  ) {}

  async findById(id: string): Promise<Category | null> {
    const entity = await this.categoryRepo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Category[]> {
    const entities = await this.categoryRepo.find({
      order: { name: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByParentId(parentId: string | null): Promise<Category[]> {
    const entities = await this.categoryRepo.find({
      where: { parentId: parentId === null ? IsNull() : parentId },
      order: { name: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findRootCategories(): Promise<Category[]> {
    return this.findByParentId(null);
  }

  async save(category: Category): Promise<Category> {
    const entity = this.toEntity(category);
    const savedEntity = await this.categoryRepo.save(entity);
    return this.toDomain(savedEntity);
  }

  async update(category: Category): Promise<Category> {
    const entity = this.toEntity(category);
    const updatedEntity = await this.categoryRepo.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.categoryRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.categoryRepo.count({ where: { id } });
    return count > 0;
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await this.categoryRepo.count({ where: { parentId: id } });
    return count > 0;
  }

  // Mapping methods
  private toDomain(entity: CategoryEntity): Category {
    return Category.reconstitute({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      parentId: entity.parentId,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(category: Category): CategoryEntity {
    const entity = new CategoryEntity();
    entity.id = category.id;
    entity.name = category.name;
    entity.description = category.description;
    entity.parentId = category.parentId;
    entity.isActive = category.isActive;
    entity.createdAt = category.createdAt;
    entity.updatedAt = category.updatedAt;
    return entity;
  }
}
