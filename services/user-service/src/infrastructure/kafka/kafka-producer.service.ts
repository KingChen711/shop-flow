import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KafkaTopics, DomainEvent } from '@shopflow/shared-types';
import { generateId, now } from '@shopflow/shared-utils';

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

  async publish(topic: string, event: DomainEvent): Promise<void> {
    try {
      await this.kafkaClient.emit(topic, {
        key: event.aggregateId,
        value: JSON.stringify(event),
        headers: {
          eventType: event.eventType,
          eventId: event.eventId,
          occurredAt: event.occurredAt.toISOString(),
        },
      });
      this.logger.debug(`Published event ${event.eventType} to ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to publish event to ${topic}`, error);
      throw error;
    }
  }

  async publishUserCreated(
    userId: string,
    email: string,
    firstName: string,
    lastName: string
  ): Promise<void> {
    const event: DomainEvent = {
      eventId: generateId(),
      eventType: 'UserCreated',
      aggregateId: userId,
      aggregateType: 'User',
      payload: { userId, email, firstName, lastName },
      occurredAt: now(),
    };

    await this.publish(KafkaTopics.USER_CREATED, event);
  }

  async publishUserUpdated(userId: string, changes: Record<string, unknown>): Promise<void> {
    const event: DomainEvent = {
      eventId: generateId(),
      eventType: 'UserUpdated',
      aggregateId: userId,
      aggregateType: 'User',
      payload: { userId, changes },
      occurredAt: now(),
    };

    await this.publish(KafkaTopics.USER_UPDATED, event);
  }

  async publishUserDeleted(userId: string, email: string): Promise<void> {
    const event: DomainEvent = {
      eventId: generateId(),
      eventType: 'UserDeleted',
      aggregateId: userId,
      aggregateType: 'User',
      payload: { userId, email },
      occurredAt: now(),
    };

    await this.publish(KafkaTopics.USER_DELETED, event);
  }
}
