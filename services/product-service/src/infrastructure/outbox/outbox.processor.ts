import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxService } from './outbox.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { DomainEvent } from '@shopflow/shared-types';

/**
 * OutboxProcessor - Processes outbox events and publishes to Kafka
 *
 * This runs on a schedule and:
 * 1. Reads unprocessed events from the outbox table
 * 2. Publishes each event to Kafka
 * 3. Marks events as processed on success
 * 4. Handles retries on failure
 *
 * This ensures reliable event delivery even if Kafka was temporarily unavailable
 */
@Injectable()
export class OutboxProcessor implements OnModuleInit {
  private readonly logger = new Logger(OutboxProcessor.name);
  private isProcessing = false;

  constructor(
    private readonly outboxService: OutboxService,
    private readonly kafkaProducer: KafkaProducerService
  ) {}

  onModuleInit() {
    this.logger.log('OutboxProcessor initialized - will process events every 5 seconds');
  }

  /**
   * Process outbox events every 5 seconds
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutbox(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const events = await this.outboxService.getUnprocessedEvents(50);

      if (events.length === 0) {
        return;
      }

      this.logger.debug(`Processing ${events.length} outbox events`);

      for (const outboxEvent of events) {
        try {
          // Reconstruct the domain event
          const domainEvent: DomainEvent = {
            eventId: outboxEvent.payload.eventId as string,
            eventType: outboxEvent.eventType,
            aggregateId: outboxEvent.aggregateId,
            aggregateType: outboxEvent.aggregateType,
            payload: outboxEvent.payload.payload,
            occurredAt: new Date(outboxEvent.payload.occurredAt as string),
          };

          // Determine the topic based on aggregate type and event type
          const topic = this.getTopicForEvent(outboxEvent.aggregateType, outboxEvent.eventType);

          // Publish to Kafka
          await this.kafkaProducer.publishToTopic(topic, domainEvent);

          // Mark as processed
          await this.outboxService.markAsProcessed(outboxEvent.id);

          this.logger.debug(`Published event ${outboxEvent.eventType} to ${topic}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Failed to process outbox event ${outboxEvent.id}: ${errorMessage}`);

          // Mark as failed for retry
          await this.outboxService.markAsFailed(outboxEvent.id, errorMessage);

          // Skip to next event - don't block on failures
          // Events will be retried on next processing cycle
        }
      }
    } catch (error) {
      this.logger.error('Error in outbox processing', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Cleanup old processed events daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldEvents(): Promise<void> {
    try {
      const deleted = await this.outboxService.deleteProcessedEvents(7);
      this.logger.log(`Cleaned up ${deleted} old outbox events`);
    } catch (error) {
      this.logger.error('Error cleaning up outbox events', error);
    }
  }

  /**
   * Map aggregate type and event type to Kafka topic
   */
  private getTopicForEvent(aggregateType: string, eventType: string): string {
    const topicMap: Record<string, string> = {
      ProductCreated: 'product.created',
      ProductUpdated: 'product.updated',
      ProductDeleted: 'product.deleted',
      ProductImageAdded: 'product.image.added',
      CategoryCreated: 'category.created',
      CategoryUpdated: 'category.updated',
    };

    return topicMap[eventType] || `${aggregateType.toLowerCase()}.events`;
  }
}
