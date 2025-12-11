import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../domain/entities/product.entity';
import {
  IProductRepository,
  ProductFilters,
} from '../../../domain/repositories/product.repository.interface';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class ProductRepositoryImpl implements IProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>
  ) {}

  async findById(id: string): Promise<Product | null> {
    const entity = await this.productRepo.findOne({
      where: { id },
      relations: ['category'],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(params: {
    page: number;
    limit: number;
    filters?: ProductFilters;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ products: Product[]; total: number }> {
    const { page, limit, filters, sortBy = 'createdAt', sortOrder = 'DESC' } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepo.createQueryBuilder('product');
    queryBuilder.leftJoinAndSelect('product.category', 'category');

    // Apply filters
    if (filters) {
      if (filters.categoryId) {
        queryBuilder.andWhere('product.categoryId = :categoryId', {
          categoryId: filters.categoryId,
        });
      }
      if (filters.search) {
        queryBuilder.andWhere('(product.name ILIKE :search OR product.description ILIKE :search)', {
          search: `%${filters.search}%`,
        });
      }
      if (filters.minPrice !== undefined) {
        queryBuilder.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
      }
      if (filters.maxPrice !== undefined) {
        queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
      }
      if (filters.isActive !== undefined) {
        queryBuilder.andWhere('product.isActive = :isActive', { isActive: filters.isActive });
      }
    }

    // Apply sorting
    const validSortFields = ['name', 'price', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`product.${sortField}`, sortOrder);

    const [entities, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      products: entities.map((entity) => this.toDomain(entity)),
      total,
    };
  }

  async save(product: Product): Promise<Product> {
    const entity = this.toEntity(product);
    const savedEntity = await this.productRepo.save(entity);
    return this.toDomain(savedEntity);
  }

  async update(product: Product): Promise<Product> {
    const entity = this.toEntity(product);
    const updatedEntity = await this.productRepo.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.productRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.productRepo.count({ where: { id } });
    return count > 0;
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    const entities = await this.productRepo.find({
      where: { categoryId, isActive: true },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  // Mapping methods
  private toDomain(entity: ProductEntity): Product {
    return Product.reconstitute({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      price: Number(entity.price),
      categoryId: entity.categoryId,
      imageUrls: entity.imageUrls || [],
      attributes: entity.attributes || {},
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(product: Product): ProductEntity {
    const entity = new ProductEntity();
    entity.id = product.id;
    entity.name = product.name;
    entity.description = product.description;
    entity.price = product.price;
    entity.categoryId = product.categoryId;
    entity.imageUrls = product.imageUrls;
    entity.attributes = product.attributes;
    entity.isActive = product.isActive;
    entity.createdAt = product.createdAt;
    entity.updatedAt = product.updatedAt;
    return entity;
  }
}
