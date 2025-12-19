import { DomainEvent } from '@shopflow/shared-types';
import { generateId, now } from '@shopflow/shared-utils';

export class ProductCreatedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'ProductCreated';
  public readonly aggregateType = 'Product';
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly payload: {
      productId: string;
      name: string;
      description: string;
      price: number;
      categoryId: string;
      categoryName?: string;
      imageUrls: string[];
      attributes: Record<string, string>;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }
  ) {
    this.eventId = generateId();
    this.occurredAt = now();
  }
}

export class ProductUpdatedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'ProductUpdated';
  public readonly aggregateType = 'Product';
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly payload: {
      productId: string;
      name: string;
      description: string;
      price: number;
      categoryId: string;
      categoryName?: string;
      imageUrls: string[];
      attributes: Record<string, string>;
      isActive: boolean;
      updatedAt: string;
      changes: Record<string, unknown>;
    }
  ) {
    this.eventId = generateId();
    this.occurredAt = now();
  }
}

export class ProductDeletedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'ProductDeleted';
  public readonly aggregateType = 'Product';
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly payload: {
      productId: string;
      name: string;
    }
  ) {
    this.eventId = generateId();
    this.occurredAt = now();
  }
}

export class ProductImageAddedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'ProductImageAdded';
  public readonly aggregateType = 'Product';
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly payload: {
      productId: string;
      imageUrl: string;
    }
  ) {
    this.eventId = generateId();
    this.occurredAt = now();
  }
}
