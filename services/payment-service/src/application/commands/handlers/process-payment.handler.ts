import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ProcessPaymentCommand } from '../process-payment.command';
import { Payment } from '@domain/entities/payment.entity';
import { IPaymentRepository } from '@domain/repositories/payment.repository.interface';
import { PaymentProcessedEvent, PaymentFailedEvent } from '@domain/events/payment.events';
import { PaymentGatewayService } from '@infrastructure/gateway/payment-gateway.service';
import { ConflictError } from '@shopflow/shared-utils';

@CommandHandler(ProcessPaymentCommand)
export class ProcessPaymentHandler implements ICommandHandler<ProcessPaymentCommand> {
  private readonly logger = new Logger(ProcessPaymentHandler.name);

  constructor(
    @Inject('PaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentGateway: PaymentGatewayService,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: ProcessPaymentCommand): Promise<Payment> {
    const { orderId, userId, amount, currency, paymentMethod, idempotencyKey, paymentDetails } =
      command;

    // Check for existing payment with same idempotency key (idempotent operation)
    const existingPayment = await this.paymentRepository.findByIdempotencyKey(idempotencyKey);
    if (existingPayment) {
      this.logger.log(`Returning existing payment for idempotency key: ${idempotencyKey}`);
      return existingPayment;
    }

    // Check if payment already exists for this order
    const existingOrderPayment = await this.paymentRepository.findByOrderId(orderId);
    if (existingOrderPayment && existingOrderPayment.status === 'COMPLETED') {
      throw new ConflictError(`Payment already completed for order: ${orderId}`);
    }

    // Create payment entity
    const payment = Payment.create({
      orderId,
      userId,
      amount,
      currency,
      paymentMethod,
      idempotencyKey,
    });

    // Save initial payment (PENDING)
    await this.paymentRepository.save(payment);
    this.logger.log(`Payment created: ${payment.id} for order ${orderId}`);

    // Start processing
    payment.startProcessing();
    await this.paymentRepository.update(payment);

    try {
      // Process through payment gateway (simulated)
      const result = await this.paymentGateway.processPayment({
        amount,
        currency,
        paymentMethod,
        paymentDetails,
      });

      if (result.success) {
        payment.complete(result.transactionId!);
        await this.paymentRepository.update(payment);

        // Publish success event
        this.eventBus.publish(
          new PaymentProcessedEvent(
            payment.id,
            orderId,
            userId,
            amount,
            currency,
            payment.status,
            result.transactionId
          )
        );

        this.logger.log(`Payment completed: ${payment.id}, txn: ${result.transactionId}`);
      } else {
        payment.fail(result.errorMessage || 'Payment failed');
        await this.paymentRepository.update(payment);

        // Publish failure event
        this.eventBus.publish(
          new PaymentFailedEvent(payment.id, orderId, result.errorMessage || 'Payment failed')
        );

        this.logger.warn(`Payment failed: ${payment.id}, reason: ${result.errorMessage}`);
      }

      return payment;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      payment.fail(errorMsg);
      await this.paymentRepository.update(payment);

      this.eventBus.publish(new PaymentFailedEvent(payment.id, orderId, errorMsg));
      this.logger.error(`Payment error: ${payment.id}`, error);

      return payment;
    }
  }
}
