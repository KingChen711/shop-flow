import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { SendEmailCommand } from '@application/commands/send-email.command';
import { TemplateType } from '@domain/entities/template.entity';
import { NotificationChannel } from '@domain/entities/notification.entity';
import { ITemplateRepository } from '@domain/repositories/template.repository.interface';
import { Inject } from '@nestjs/common';

interface OrderEvent {
  orderId: string;
  userId: string;
  totalAmount?: number;
  items?: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  reason?: string;
}

interface PaymentEvent {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  status: string;
}

@Injectable()
export class NotificationEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationEventsConsumer.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly commandBus: CommandBus,
    @Inject('TemplateRepository')
    private readonly templateRepository: ITemplateRepository
  ) {
    const broker = this.configService.get('KAFKA_BROKER', 'localhost:9092');

    this.kafka = new Kafka({
      clientId: 'notification-service',
      brokers: [broker],
    });

    this.consumer = this.kafka.consumer({
      groupId: 'notification-service-group',
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      this.logger.log('Kafka consumer connected');

      // Subscribe to topics
      await this.consumer.subscribe({ topic: 'order.created', fromBeginning: false });
      await this.consumer.subscribe({ topic: 'order.confirmed', fromBeginning: false });
      await this.consumer.subscribe({ topic: 'order.cancelled', fromBeginning: false });
      await this.consumer.subscribe({ topic: 'payment.processed', fromBeginning: false });
      await this.consumer.subscribe({ topic: 'payment.failed', fromBeginning: false });

      this.logger.log('Subscribed to notification topics');

      // Start consuming
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });
    } catch (error) {
      this.logger.error('Failed to initialize Kafka consumer:', error);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.consumer.disconnect();
      this.logger.log('Kafka consumer disconnected');
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;

    if (!message.value) {
      return;
    }

    try {
      const eventData = JSON.parse(message.value.toString());
      this.logger.log(`Received event from topic ${topic}: ${JSON.stringify(eventData)}`);

      switch (topic) {
        case 'order.created':
          await this.handleOrderCreated(eventData);
          break;
        case 'order.confirmed':
          await this.handleOrderConfirmed(eventData);
          break;
        case 'order.cancelled':
          await this.handleOrderCancelled(eventData);
          break;
        case 'payment.processed':
          await this.handlePaymentProcessed(eventData);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(eventData);
          break;
        default:
          this.logger.warn(`Unknown topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error processing message from ${topic}:`, error);
    }
  }

  private async handleOrderCreated(event: OrderEvent): Promise<void> {
    const template = await this.templateRepository.findByTypeAndChannel(
      TemplateType.ORDER_CREATED,
      NotificationChannel.EMAIL
    );

    if (!template) {
      this.logger.warn('No ORDER_CREATED email template found');
      // Send with default content
      const command = new SendEmailCommand(
        `user-${event.userId}@example.com`, // In production, fetch user email
        'Customer',
        undefined,
        'Your Order Has Been Received!',
        `<h1>Thank you for your order!</h1>
         <p>Your order <strong>#${event.orderId}</strong> has been received and is being processed.</p>
         <p>Total Amount: $${event.totalAmount?.toFixed(2) || '0.00'}</p>
         <p>We'll send you another email when your order is confirmed.</p>`,
        {},
        event.userId,
        event.orderId,
        'order'
      );
      await this.commandBus.execute(command);
      return;
    }

    const command = new SendEmailCommand(
      `user-${event.userId}@example.com`,
      'Customer',
      template.id,
      undefined,
      undefined,
      {
        orderId: event.orderId,
        totalAmount: event.totalAmount?.toFixed(2) || '0.00',
      },
      event.userId,
      event.orderId,
      'order'
    );

    await this.commandBus.execute(command);
  }

  private async handleOrderConfirmed(event: OrderEvent): Promise<void> {
    const template = await this.templateRepository.findByTypeAndChannel(
      TemplateType.ORDER_CONFIRMED,
      NotificationChannel.EMAIL
    );

    const command = new SendEmailCommand(
      `user-${event.userId}@example.com`,
      'Customer',
      template?.id,
      template ? undefined : 'Your Order is Confirmed!',
      template
        ? undefined
        : `<h1>Order Confirmed!</h1>
           <p>Great news! Your order <strong>#${event.orderId}</strong> has been confirmed.</p>
           <p>We are preparing your items for shipment.</p>`,
      { orderId: event.orderId },
      event.userId,
      event.orderId,
      'order'
    );

    await this.commandBus.execute(command);
  }

  private async handleOrderCancelled(event: OrderEvent): Promise<void> {
    const template = await this.templateRepository.findByTypeAndChannel(
      TemplateType.ORDER_CANCELLED,
      NotificationChannel.EMAIL
    );

    const command = new SendEmailCommand(
      `user-${event.userId}@example.com`,
      'Customer',
      template?.id,
      template ? undefined : 'Your Order Has Been Cancelled',
      template
        ? undefined
        : `<h1>Order Cancelled</h1>
           <p>Your order <strong>#${event.orderId}</strong> has been cancelled.</p>
           <p>Reason: ${event.reason || 'No reason provided'}</p>
           <p>If you have any questions, please contact our support team.</p>`,
      { orderId: event.orderId, reason: event.reason || 'No reason provided' },
      event.userId,
      event.orderId,
      'order'
    );

    await this.commandBus.execute(command);
  }

  private async handlePaymentProcessed(event: PaymentEvent): Promise<void> {
    const template = await this.templateRepository.findByTypeAndChannel(
      TemplateType.PAYMENT_SUCCESS,
      NotificationChannel.EMAIL
    );

    const command = new SendEmailCommand(
      `user-${event.userId}@example.com`,
      'Customer',
      template?.id,
      template ? undefined : 'Payment Successful',
      template
        ? undefined
        : `<h1>Payment Received!</h1>
           <p>We have received your payment of <strong>$${event.amount.toFixed(2)}</strong> for order <strong>#${event.orderId}</strong>.</p>
           <p>Payment ID: ${event.paymentId}</p>
           <p>Thank you for your purchase!</p>`,
      {
        paymentId: event.paymentId,
        orderId: event.orderId,
        amount: event.amount.toFixed(2),
      },
      event.userId,
      event.orderId,
      'payment'
    );

    await this.commandBus.execute(command);
  }

  private async handlePaymentFailed(event: PaymentEvent): Promise<void> {
    const template = await this.templateRepository.findByTypeAndChannel(
      TemplateType.PAYMENT_FAILED,
      NotificationChannel.EMAIL
    );

    const command = new SendEmailCommand(
      `user-${event.userId}@example.com`,
      'Customer',
      template?.id,
      template ? undefined : 'Payment Failed',
      template
        ? undefined
        : `<h1>Payment Failed</h1>
           <p>Unfortunately, your payment of <strong>$${event.amount.toFixed(2)}</strong> for order <strong>#${event.orderId}</strong> could not be processed.</p>
           <p>Please try again or use a different payment method.</p>`,
      { orderId: event.orderId, amount: event.amount.toFixed(2) },
      event.userId,
      event.orderId,
      'payment'
    );

    await this.commandBus.execute(command);
  }
}
