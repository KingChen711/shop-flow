import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, CompressionTypes } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'inventory-service',
      brokers: [this.configService.get('KAFKA_BROKER', 'localhost:9092')],
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Kafka producer connected');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer:', error);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    }
  }

  async publish(topic: string, message: any): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Kafka producer not connected, skipping message');
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.id || message.productId || String(Date.now()),
            value: JSON.stringify(message),
            timestamp: String(Date.now()),
          },
        ],
        compression: CompressionTypes.GZIP,
      });
      this.logger.debug(`Message published to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to publish message to ${topic}:`, error);
      throw error;
    }
  }

  async publishBatch(topic: string, messages: any[]): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Kafka producer not connected, skipping messages');
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: messages.map((msg) => ({
          key: msg.id || msg.productId || String(Date.now()),
          value: JSON.stringify(msg),
          timestamp: String(Date.now()),
        })),
        compression: CompressionTypes.GZIP,
      });
      this.logger.debug(`Batch of ${messages.length} messages published to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to publish batch to ${topic}:`, error);
      throw error;
    }
  }
}
