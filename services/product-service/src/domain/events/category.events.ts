import { DomainEvent } from '@shopflow/shared-types';
import { generateId, now } from '@shopflow/shared-utils';

export class CategoryCreatedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'CategoryCreated';
  public readonly aggregateType = 'Category';
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly payload: {
      categoryId: string;
      name: string;
      parentId: string | null;
    }
  ) {
    this.eventId = generateId();
    this.occurredAt = now();
  }
}

export class CategoryUpdatedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'CategoryUpdated';
  public readonly aggregateType = 'Category';
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly payload: {
      categoryId: string;
      changes: Record<string, unknown>;
    }
  ) {
    this.eventId = generateId();
    this.occurredAt = now();
  }
}
