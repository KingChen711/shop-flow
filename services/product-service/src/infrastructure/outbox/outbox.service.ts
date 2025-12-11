import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { DomainEvent } from '@shopflow/shared-types';
import { OutboxEntity } from '../persistence/entities/outbox.entity';

/**
 * OutboxService - Implements the Transactional Outbox Pattern
 *
 * The Outbox Pattern ensures reliable event publishing by:
 * 1. Writing events to an outbox table within the same transaction as domain changes
 * 2. A separate process (OutboxProcessor) reads and publishes events to Kafka
 * 3. This guarantees at-least-once delivery and eventual consistency
 *
 * Benefits:
 * - No dual-write problem (both DB and Kafka in same transaction)
 * - Events are persisted even if Kafka is temporarily unavailable
 * - Exactly-once semantics can be achieved with idempotent consumers
 */
@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepo: Repository<OutboxEntity>
  ) {}

  /**
   * Add an event to the outbox table
   * This should be called within the same transaction as domain changes
   */
  async addEvent(event: DomainEvent, entityManager?: EntityManager): Promise<void> {
    const outboxEvent = new OutboxEntity();
    outboxEvent.aggregateType = event.aggregateType;
    outboxEvent.aggregateId = event.aggregateId;
    outboxEvent.eventType = event.eventType;
    outboxEvent.payload = {
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventType: event.eventType,
      payload: event.payload,
      occurredAt: event.occurredAt.toISOString(),
    };
    outboxEvent.isProcessed = false;

    if (entityManager) {
      // Use the provided entity manager (for transactions)
      await entityManager.save(OutboxEntity, outboxEvent);
    } else {
      await this.outboxRepo.save(outboxEvent);
    }

    this.logger.debug(`Added event to outbox: ${event.eventType} for ${event.aggregateId}`);
  }

  /**
   * Get unprocessed events from the outbox
   * Used by the OutboxProcessor to publish events to Kafka
   */
  async getUnprocessedEvents(limit: number = 100): Promise<OutboxEntity[]> {
    return this.outboxRepo.find({
      where: { isProcessed: false },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Mark an event as processed after successful publishing
   */
  async markAsProcessed(id: string): Promise<void> {
    await this.outboxRepo.update(id, {
      isProcessed: true,
      processedAt: new Date(),
    });
  }

  /**
   * Mark an event as failed with error message
   */
  async markAsFailed(id: string, errorMessage: string): Promise<void> {
    await this.outboxRepo.increment({ id }, 'retryCount', 1);
    await this.outboxRepo.update(id, { errorMessage });
  }

  /**
   * Delete old processed events (cleanup)
   */
  async deleteProcessedEvents(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.outboxRepo
      .createQueryBuilder()
      .delete()
      .where('is_processed = :isProcessed', { isProcessed: true })
      .andWhere('processed_at < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected ?? 0;
  }
}
