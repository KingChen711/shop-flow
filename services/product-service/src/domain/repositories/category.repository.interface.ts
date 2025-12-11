import { Category } from '../entities/category.entity';

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findByParentId(parentId: string | null): Promise<Category[]>;
  findRootCategories(): Promise<Category[]>;
  save(category: Category): Promise<Category>;
  update(category: Category): Promise<Category>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  hasChildren(id: string): Promise<boolean>;
}

export const CATEGORY_REPOSITORY = 'CategoryRepository';
