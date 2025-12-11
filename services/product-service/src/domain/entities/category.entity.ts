import { generateId, now } from '@shopflow/shared-utils';

export interface CategoryProps {
  id?: string;
  name: string;
  description: string;
  parentId?: string | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Category {
  private readonly props: Required<Omit<CategoryProps, 'parentId'>> & {
    parentId: string | null;
  };

  private constructor(props: CategoryProps) {
    this.props = {
      id: props.id || generateId(),
      name: props.name,
      description: props.description,
      parentId: props.parentId || null,
      isActive: props.isActive ?? true,
      createdAt: props.createdAt || now(),
      updatedAt: props.updatedAt || now(),
    };
  }

  // Factory method for creating new categories
  static create(props: Omit<CategoryProps, 'id' | 'createdAt' | 'updatedAt'>): Category {
    return new Category(props);
  }

  // Factory method for reconstituting from persistence
  static reconstitute(props: CategoryProps): Category {
    return new Category(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isRootCategory(): boolean {
    return this.props.parentId === null;
  }

  // Business Logic Methods
  updateDetails(data: { name?: string; description?: string }): void {
    if (data.name) {
      this.props.name = data.name;
    }
    if (data.description !== undefined) {
      this.props.description = data.description;
    }
    this.props.updatedAt = now();
  }

  setParent(parentId: string | null): void {
    // Prevent circular reference
    if (parentId === this.props.id) {
      throw new Error('Category cannot be its own parent');
    }
    this.props.parentId = parentId;
    this.props.updatedAt = now();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = now();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = now();
  }

  // Serialization
  toJSON(): Record<string, unknown> {
    return {
      id: this.props.id,
      name: this.props.name,
      description: this.props.description,
      parentId: this.props.parentId,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
