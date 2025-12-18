import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxEntity } from '@infrastructure/persistence/entities/outbox.entity';
import { KafkaProducerService } from '@infrastructure/kafka/kafka-producer.service';

@Injectable()
export class OutboxProcessor implements OnModuleInit {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
    private readonly kafkaProducer: KafkaProducerService
  ) {}

  onModuleInit() {
    this.logger.log('Outbox processor initialized');
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxEvents() {
    const unprocessedEvents = await this.outboxRepository.find({
      where: { processed: false },
      order: { createdAt: 'ASC' },
      take: 100,
    });

    if (unprocessedEvents.length === 0) {
      return;
    }

    this.logger.debug(`Processing ${unprocessedEvents.length} outbox events`);

    for (const event of unprocessedEvents) {
      try {
        // Determine topic based on event type
        const topic = this.getTopicForEvent(event.eventType);

        // Send to Kafka
        await this.kafkaProducer.send(topic, {
          key: event.aggregateId,
          value: JSON.stringify(event.payload),
        });

        // Mark as processed
        event.processed = true;
        event.processedAt = new Date();
        await this.outboxRepository.save(event);

        this.logger.debug(`Processed outbox event: ${event.eventType}`);
      } catch (error) {
        this.logger.error(`Failed to process outbox event ${event.id}:`, error);
        event.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.outboxRepository.save(event);
      }
    }
  }

  private getTopicForEvent(eventType: string): string {
    const topicMap: Record<string, string> = {
      'order.created': 'order-events',
      'order.confirmed': 'order-events',
      'order.cancelled': 'order-events',
      'order.failed': 'order-events',
      'saga.started': 'saga-events',
      'saga.completed': 'saga-events',
      'saga.failed': 'saga-events',
    };

    return topicMap[eventType] || 'order-events';
  }
}
