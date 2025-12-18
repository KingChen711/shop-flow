import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ProcessPaymentCommand } from '@application/commands/process-payment.command';
import { RefundPaymentCommand } from '@application/commands/refund-payment.command';
import { GetPaymentQuery } from '@application/queries/get-payment.query';
import { GetPaymentByOrderQuery } from '@application/queries/get-payment-by-order.query';
import { ListPaymentsQuery } from '@application/queries/list-payments.query';
import { Payment, PaymentStatus, PaymentMethod } from '@domain/entities/payment.entity';
import { NotFoundError, ValidationError, ConflictError } from '@shopflow/shared-utils';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

// Proto status enum mapping
const PAYMENT_STATUS_MAP: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'PAYMENT_STATUS_PENDING',
  [PaymentStatus.PROCESSING]: 'PAYMENT_STATUS_PROCESSING',
  [PaymentStatus.COMPLETED]: 'PAYMENT_STATUS_COMPLETED',
  [PaymentStatus.FAILED]: 'PAYMENT_STATUS_FAILED',
  [PaymentStatus.REFUNDED]: 'PAYMENT_STATUS_REFUNDED',
  [PaymentStatus.PARTIALLY_REFUNDED]: 'PAYMENT_STATUS_PARTIALLY_REFUNDED',
};

const PROTO_TO_PAYMENT_STATUS: Record<string, PaymentStatus> = {
  PAYMENT_STATUS_PENDING: PaymentStatus.PENDING,
  PAYMENT_STATUS_PROCESSING: PaymentStatus.PROCESSING,
  PAYMENT_STATUS_COMPLETED: PaymentStatus.COMPLETED,
  PAYMENT_STATUS_FAILED: PaymentStatus.FAILED,
  PAYMENT_STATUS_REFUNDED: PaymentStatus.REFUNDED,
  PAYMENT_STATUS_PARTIALLY_REFUNDED: PaymentStatus.PARTIALLY_REFUNDED,
};

const PAYMENT_METHOD_MAP: Record<PaymentMethod, string> = {
  [PaymentMethod.CREDIT_CARD]: 'PAYMENT_METHOD_CREDIT_CARD',
  [PaymentMethod.DEBIT_CARD]: 'PAYMENT_METHOD_DEBIT_CARD',
  [PaymentMethod.BANK_TRANSFER]: 'PAYMENT_METHOD_BANK_TRANSFER',
  [PaymentMethod.WALLET]: 'PAYMENT_METHOD_WALLET',
};

const PROTO_TO_PAYMENT_METHOD: Record<string, PaymentMethod> = {
  PAYMENT_METHOD_CREDIT_CARD: PaymentMethod.CREDIT_CARD,
  PAYMENT_METHOD_DEBIT_CARD: PaymentMethod.DEBIT_CARD,
  PAYMENT_METHOD_BANK_TRANSFER: PaymentMethod.BANK_TRANSFER,
  PAYMENT_METHOD_WALLET: PaymentMethod.WALLET,
  '1': PaymentMethod.CREDIT_CARD,
  '2': PaymentMethod.DEBIT_CARD,
  '3': PaymentMethod.BANK_TRANSFER,
  '4': PaymentMethod.WALLET,
};

@Controller()
export class PaymentGrpcController {
  private readonly logger = new Logger(PaymentGrpcController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @GrpcMethod('PaymentService', 'ProcessPayment')
  async processPayment(data: any): Promise<any> {
    try {
      this.logger.log(`ProcessPayment request: order_id=${data.order_id}`);

      const paymentMethod =
        PROTO_TO_PAYMENT_METHOD[data.payment_method] || PaymentMethod.CREDIT_CARD;

      const command = new ProcessPaymentCommand(
        data.order_id,
        data.user_id,
        Number(data.amount),
        data.currency || 'USD',
        paymentMethod,
        data.idempotency_key,
        data.payment_details
      );

      const payment = await this.commandBus.execute<ProcessPaymentCommand, Payment>(command);
      return this.toPaymentResponse(payment);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('PaymentService', 'GetPayment')
  async getPayment(data: any): Promise<any> {
    try {
      this.logger.log(`GetPayment request: payment_id=${data.payment_id}`);

      const query = new GetPaymentQuery(data.payment_id);
      const payment = await this.queryBus.execute<GetPaymentQuery, Payment>(query);

      return this.toPaymentResponse(payment);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('PaymentService', 'GetPaymentByOrder')
  async getPaymentByOrder(data: any): Promise<any> {
    try {
      this.logger.log(`GetPaymentByOrder request: order_id=${data.order_id}`);

      const query = new GetPaymentByOrderQuery(data.order_id);
      const payment = await this.queryBus.execute<GetPaymentByOrderQuery, Payment>(query);

      return this.toPaymentResponse(payment);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('PaymentService', 'RefundPayment')
  async refundPayment(data: any): Promise<any> {
    try {
      this.logger.log(`RefundPayment request: payment_id=${data.payment_id}`);

      const command = new RefundPaymentCommand(
        data.payment_id,
        data.amount ? Number(data.amount) : undefined,
        data.reason
      );

      const payment = await this.commandBus.execute<RefundPaymentCommand, Payment>(command);
      return this.toPaymentResponse(payment);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @GrpcMethod('PaymentService', 'ListPayments')
  async listPayments(data: any): Promise<any> {
    try {
      this.logger.log(`ListPayments request: user_id=${data.user_id}`);

      const status = data.status ? PROTO_TO_PAYMENT_STATUS[data.status] : undefined;
      const query = new ListPaymentsQuery(data.user_id, data.page || 1, data.limit || 10, status);

      const result = await this.queryBus.execute(query);

      return {
        payments: result.payments.map((payment: Payment) => this.toPaymentResponse(payment)),
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private toPaymentResponse(payment: Payment): any {
    return {
      id: payment.id,
      order_id: payment.orderId,
      user_id: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      status: PAYMENT_STATUS_MAP[payment.status],
      payment_method: PAYMENT_METHOD_MAP[payment.paymentMethod],
      transaction_id: payment.transactionId || '',
      error_message: payment.errorMessage || '',
      refunded_amount: payment.refundedAmount,
      created_at: payment.createdAt.toISOString(),
      updated_at: payment.updatedAt.toISOString(),
    };
  }

  private handleError(error: unknown): RpcException {
    const err = error instanceof Error ? error : new Error('Unknown error');
    this.logger.error(`Error: ${err.message}`, err.stack);

    if (error instanceof NotFoundError) {
      return new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: error.message,
      });
    }

    if (error instanceof ValidationError) {
      return new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: error.message,
      });
    }

    if (error instanceof ConflictError) {
      return new RpcException({
        code: GrpcStatus.FAILED_PRECONDITION,
        message: error.message,
      });
    }

    return new RpcException({
      code: GrpcStatus.INTERNAL,
      message: err.message || 'Internal server error',
    });
  }
}
