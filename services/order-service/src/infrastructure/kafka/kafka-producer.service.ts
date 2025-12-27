import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'order-service',
      brokers: this.configService
        .get<string>('KAFKA_BROKERS', 'localhost:9092')
        .split(',')
        .map((b) => b.trim()),
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Kafka producer connected');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to connect to Kafka: ${errorMsg}`);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    }
  }

  async send(topic: string, message: { key: string; value: string }): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(`Kafka not connected, skipping message to ${topic}`);
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [message],
      });
      this.logger.debug(`Message sent to ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to send message to ${topic}:`, error);
      throw error;
    }
  }
}
