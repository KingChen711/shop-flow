import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { SearchProduct } from '@domain/entities/search-product.entity';
import {
  ISearchRepository,
  SEARCH_REPOSITORY,
} from '@domain/repositories/search.repository.interface';

/**
 * CDC (Change Data Capture) Consumer for Product changes
 *
 * Listens to Debezium CDC events from the product database
 * and indexes/updates/deletes products in Elasticsearch
 *
 * Expected Debezium message format:
 * {
 *   "before": { ... },  // Previous state (for updates/deletes)
 *   "after": { ... },   // New state (for inserts/updates)
 *   "op": "c" | "u" | "d" | "r",  // Operation: create, update, delete, read (snapshot)
 *   "source": { ... }
 * }
 */
@Injectable()
export class ProductCdcConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProductCdcConsumer.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService,
    @Inject(SEARCH_REPOSITORY)
    private readonly searchRepository: ISearchRepository
  ) {
    const broker = this.configService.get('KAFKA_BROKER', 'localhost:9092');

    this.kafka = new Kafka({
      clientId: 'search-service-cdc',
      brokers: [broker],
    });

    this.consumer = this.kafka.consumer({
      groupId: 'search-service-cdc-group',
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      this.logger.log('CDC Kafka consumer connected');

      // Subscribe to Product Service event topics (via Outbox Pattern)
      const productTopics = ['product.created', 'product.updated', 'product.deleted'];

      for (const topic of productTopics) {
        try {
          await this.consumer.subscribe({ topic, fromBeginning: false });
          this.logger.log(`Subscribed to topic: ${topic}`);
        } catch {
          this.logger.warn(`Topic ${topic} not available yet`);
        }
      }

      // Optionally subscribe to Debezium CDC topic if configured
      const cdcTopic = this.configService.get('CDC_PRODUCTS_TOPIC');
      if (cdcTopic) {
        try {
          await this.consumer.subscribe({ topic: cdcTopic, fromBeginning: false });
          this.logger.log(`Subscribed to CDC topic: ${cdcTopic}`);
        } catch {
          this.logger.warn(`CDC topic ${cdcTopic} not available`);
        }
      }

      // Start consuming
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });
    } catch (error) {
      this.logger.error('Failed to initialize CDC Kafka consumer:', error);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.consumer.disconnect();
      this.logger.log('CDC Kafka consumer disconnected');
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;

    if (!message.value) {
      return;
    }

    try {
      const data = JSON.parse(message.value.toString());
      this.logger.log(
        `Received event from topic ${topic}: ${data.eventType || data.op || 'unknown'}`
      );

      // Check if this is a Debezium CDC event or a Domain event from Outbox
      if (data.op !== undefined) {
        // Debezium CDC format
        await this.handleDebeziumEvent(data);
      } else if (data.eventType && data.payload) {
        // Domain event format from Product Service Outbox
        await this.handleDomainEvent(topic, data);
      } else {
        this.logger.warn(`Unknown event format: ${JSON.stringify(data).substring(0, 200)}`);
      }
    } catch (error) {
      this.logger.error(`Error processing message from ${topic}:`, error);
    }
  }

  /**
   * Handle Debezium CDC events
   */
  private async handleDebeziumEvent(data: any): Promise<void> {
    const { op, before, after } = data;

    switch (op) {
      case 'c': // Create
      case 'r': // Read (snapshot)
        if (after) {
          const product = this.mapDebeziumToProduct(after);
          await this.searchRepository.indexProduct(product);
          this.logger.log(`Indexed product from CDC: ${product.id}`);
        }
        break;

      case 'u': // Update
        if (after) {
          const product = this.mapDebeziumToProduct(after);
          await this.searchRepository.indexProduct(product);
          this.logger.log(`Updated product in index from CDC: ${product.id}`);
        }
        break;

      case 'd': // Delete
        if (before?.id) {
          await this.searchRepository.deleteProduct(before.id);
          this.logger.log(`Deleted product from index via CDC: ${before.id}`);
        }
        break;

      default:
        this.logger.warn(`Unknown CDC operation: ${op}`);
    }
  }

  /**
   * Handle Domain events from Product Service Outbox
   * Format: { eventId, eventType, aggregateId, aggregateType, payload, occurredAt }
   */
  private async handleDomainEvent(topic: string, data: any): Promise<void> {
    const { eventType, aggregateId, payload } = data;

    this.logger.log(`Processing domain event: ${eventType} for aggregate ${aggregateId}`);

    // Handle based on topic or eventType
    if (topic === 'product.created' || eventType === 'ProductCreated') {
      if (payload) {
        const product = this.mapDomainEventToProduct(aggregateId, payload);
        await this.searchRepository.indexProduct(product);
        this.logger.log(`Indexed product from event: ${product.id} - ${product.name}`);
      }
    } else if (topic === 'product.updated' || eventType === 'ProductUpdated') {
      if (payload) {
        const product = this.mapDomainEventToProduct(aggregateId, payload);
        await this.searchRepository.indexProduct(product);
        this.logger.log(`Updated product in index: ${product.id} - ${product.name}`);
      }
    } else if (topic === 'product.deleted' || eventType === 'ProductDeleted') {
      const productId = aggregateId || payload?.id;
      if (productId) {
        await this.searchRepository.deleteProduct(productId);
        this.logger.log(`Deleted product from index: ${productId}`);
      }
    } else {
      this.logger.debug(`Ignoring event type: ${eventType}`);
    }
  }

  /**
   * Map Debezium CDC payload to SearchProduct
   */
  private mapDebeziumToProduct(data: any): SearchProduct {
    return SearchProduct.create({
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: parseFloat(data.price) || 0,
      categoryId: data.category_id || '',
      categoryName: data.category_name || '',
      imageUrls: this.parseJsonArray(data.image_urls),
      attributes: this.parseAttributes(data.attributes),
      createdAt: this.parseTimestamp(data.created_at),
      updatedAt: this.parseTimestamp(data.updated_at),
    });
  }

  /**
   * Map Domain event payload to SearchProduct
   * Payload from Product Service: { id, name, description, price, categoryId, categoryName, imageUrls, attributes }
   */
  private mapDomainEventToProduct(aggregateId: string, data: any): SearchProduct {
    // Handle both camelCase and snake_case field names
    const attributes = this.parseAttributes(data.attributes);

    return SearchProduct.create({
      id: aggregateId || data.id,
      name: data.name || '',
      description: data.description || '',
      price: parseFloat(data.price) || 0,
      categoryId: data.categoryId || data.category_id || '',
      categoryName: data.categoryName || data.category_name || '',
      imageUrls: data.imageUrls || data.image_urls || [],
      attributes: Array.isArray(attributes)
        ? attributes
        : Object.entries(attributes || {}).map(([key, value]) => ({ key, value: String(value) })),
      createdAt: new Date(data.createdAt || data.created_at || Date.now()),
      updatedAt: new Date(data.updatedAt || data.updated_at || Date.now()),
    });
  }

  private parseJsonArray(value: any): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return [];
  }

  private parseAttributes(value: any): Array<{ key: string; value: string }> {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return [];
  }

  private parseTimestamp(value: any): Date {
    if (!value) return new Date();
    // Debezium timestamps can be in microseconds
    if (typeof value === 'number') {
      // If value is very large, assume it's microseconds
      if (value > 1e15) {
        return new Date(value / 1000);
      }
      return new Date(value);
    }
    return new Date(value);
  }
}
