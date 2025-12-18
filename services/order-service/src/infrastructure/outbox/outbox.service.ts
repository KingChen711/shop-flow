import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EntityManager } from 'typeorm';
import { OutboxEntity } from '@infrastructure/persistence/entities/outbox.entity';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  async addEvent(
    event: { eventType: string; orderId?: string; [key: string]: any },
    entityManager: EntityManager
  ): Promise<void> {
    const outboxEntity = new OutboxEntity();
    outboxEntity.id = uuidv4();
    outboxEntity.aggregateType = 'Order';
    outboxEntity.aggregateId = event.orderId || 'unknown';
    outboxEntity.eventType = event.eventType;
    outboxEntity.payload = event as Record<string, unknown>;
    outboxEntity.processed = false;

    await entityManager.save(OutboxEntity, outboxEntity);

    this.logger.debug(`Added event to outbox: ${event.eventType}`);
  }
}
