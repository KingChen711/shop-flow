import { DomainEvent } from '@shopflow/shared-types';
import { generateId, now } from '@shopflow/shared-utils';

export class UserCreatedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'UserCreated';
  public readonly aggregateType = 'User';
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly payload: {
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
    }
  ) {
    this.eventId = generateId();
    this.occurredAt = now();
  }
}

export class UserUpdatedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'UserUpdated';
  public readonly aggregateType = 'User';
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly payload: {
      userId: string;
      changes: Record<string, unknown>;
    }
  ) {
    this.eventId = generateId();
    this.occurredAt = now();
  }
}

export class UserDeletedEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType = 'UserDeleted';
  public readonly aggregateType = 'User';
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly payload: {
      userId: string;
      email: string;
    }
  ) {
    this.eventId = generateId();
    this.occurredAt = now();
  }
}
