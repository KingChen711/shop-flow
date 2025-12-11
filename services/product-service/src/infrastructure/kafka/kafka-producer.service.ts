import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { DomainEvent } from '@shopflow/shared-types';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(@Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka) {}

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.logger.log('Connected to Kafka');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', error);
    }
  }

  /**
   * Publish a domain event to a specific topic
   */
  async publishToTopic(topic: string, event: DomainEvent): Promise<void> {
    try {
      await this.kafkaClient.emit(topic, {
        key: event.aggregateId,
        value: JSON.stringify(event),
        headers: {
          eventType: event.eventType,
          eventId: event.eventId,
          aggregateType: event.aggregateType,
          occurredAt: event.occurredAt.toISOString(),
        },
      });
      this.logger.debug(`Published event ${event.eventType} to ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to publish event to ${topic}`, error);
      throw error;
    }
  }

  /**
   * Publish product created event
   */
  async publishProductCreated(
    productId: string,
    name: string,
    price: number,
    categoryId: string
  ): Promise<void> {
    const event: DomainEvent = {
      eventId: crypto.randomUUID(),
      eventType: 'ProductCreated',
      aggregateId: productId,
      aggregateType: 'Product',
      payload: { productId, name, price, categoryId },
      occurredAt: new Date(),
    };

    await this.publishToTopic('product.created', event);
  }

  /**
   * Publish product updated event
   */
  async publishProductUpdated(productId: string, changes: Record<string, unknown>): Promise<void> {
    const event: DomainEvent = {
      eventId: crypto.randomUUID(),
      eventType: 'ProductUpdated',
      aggregateId: productId,
      aggregateType: 'Product',
      payload: { productId, changes },
      occurredAt: new Date(),
    };

    await this.publishToTopic('product.updated', event);
  }

  /**
   * Publish product deleted event
   */
  async publishProductDeleted(productId: string, name: string): Promise<void> {
    const event: DomainEvent = {
      eventId: crypto.randomUUID(),
      eventType: 'ProductDeleted',
      aggregateId: productId,
      aggregateType: 'Product',
      payload: { productId, name },
      occurredAt: new Date(),
    };

    await this.publishToTopic('product.deleted', event);
  }
}
