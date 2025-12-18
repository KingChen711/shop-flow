import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RefundPaymentCommand } from '../refund-payment.command';
import { Payment } from '@domain/entities/payment.entity';
import { IPaymentRepository } from '@domain/repositories/payment.repository.interface';
import { PaymentRefundedEvent } from '@domain/events/payment.events';
import { PaymentGatewayService } from '@infrastructure/gateway/payment-gateway.service';
import { NotFoundError, ConflictError } from '@shopflow/shared-utils';

@CommandHandler(RefundPaymentCommand)
export class RefundPaymentHandler implements ICommandHandler<RefundPaymentCommand> {
  private readonly logger = new Logger(RefundPaymentHandler.name);

  constructor(
    @Inject('PaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentGateway: PaymentGatewayService,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: RefundPaymentCommand): Promise<Payment> {
    const { paymentId, amount, reason } = command;

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment not found: ${paymentId}`);
    }

    if (!payment.canRefund()) {
      throw new ConflictError(`Cannot refund payment in status: ${payment.status}`);
    }

    const refundAmount = amount ?? payment.getRemainingRefundable();

    if (refundAmount > payment.getRemainingRefundable()) {
      throw new ConflictError(
        `Refund amount ${refundAmount} exceeds remaining refundable amount ${payment.getRemainingRefundable()}`
      );
    }

    // Process refund through gateway (simulated)
    const result = await this.paymentGateway.refundPayment({
      transactionId: payment.transactionId!,
      amount: refundAmount,
    });

    if (result.success) {
      payment.refund(refundAmount);
      await this.paymentRepository.update(payment);

      // Publish refund event
      this.eventBus.publish(
        new PaymentRefundedEvent(
          payment.id,
          payment.orderId,
          refundAmount,
          reason || 'Refund requested'
        )
      );

      this.logger.log(`Payment refunded: ${payment.id}, amount: ${refundAmount}`);
    } else {
      throw new Error(`Refund failed: ${result.errorMessage}`);
    }

    return payment;
  }
}
